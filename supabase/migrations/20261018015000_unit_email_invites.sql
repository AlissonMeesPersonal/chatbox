
-- Unit-specific invitations. A unit account shares the parent's organization
-- but gets unit-scoped access only, never owner-wide privileges.
create table if not exists public.viante_unit_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  unit_id uuid not null,
  email text not null,
  role text not null default 'manager' check (role='manager'),
  status text not null default 'pending' check(status in ('pending','accepted','revoked')),
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '7 days'),
  accepted_at timestamptz,
  constraint viante_unit_invites_unit_fk
    foreign key(unit_id,organization_id) references public.viante_units(id,organization_id) on delete cascade,
  constraint viante_unit_invites_email_check
    check(email=lower(trim(email)) and length(email) between 5 and 254),
  unique(unit_id,email)
);
alter table public.viante_unit_invitations enable row level security;
revoke all on public.viante_unit_invitations from public,anon,authenticated;
create policy viante_unit_invitations_deny_direct_select on public.viante_unit_invitations
  for select to authenticated using (false);

create or replace function viante_private.require_company_owner(p_org uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null
     or (auth.jwt()->>'aal') is distinct from 'aal2'
     or exists(select 1 from public.viante_platform_admins a where a.user_id=auth.uid())
     or not exists (
        select 1 from public.viante_memberships m
        where m.organization_id=p_org and m.user_id=auth.uid()
          and m.status='active' and m.role in ('owner','admin')
     ) then
    raise exception 'owner/admin MFA access required' using errcode='42501';
  end if;
end
$$;
revoke all on function viante_private.require_company_owner(uuid) from public,anon;
grant execute on function viante_private.require_company_owner(uuid) to authenticated;

create or replace function viante_private.invite_unit(p_org uuid,p_unit uuid,p_email text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_email text; v_id uuid;
begin
  perform viante_private.require_company_owner(p_org);
  v_email:=lower(trim(p_email));
  if length(v_email) < 5 or length(v_email)>254 or
     v_email !~ '^[^ @[:space:]]+@[^ @[:space:]]+[.][^ @[:space:]]+$' then
    raise exception 'invalid unit email' using errcode='22023';
  end if;
  if not exists (select 1 from public.viante_units u
      where u.id=p_unit and u.organization_id=p_org) then
    raise exception 'unit does not belong to this organization' using errcode='42501';
  end if;
  insert into public.viante_unit_invitations
    (organization_id,unit_id,email,invited_by)
  values(p_org,p_unit,v_email,auth.uid())
  on conflict(unit_id,email) do update set
    id=gen_random_uuid(),status='pending',accepted_by=null,accepted_at=null,
    created_at=now(),expires_at=now()+interval '7 days',invited_by=auth.uid()
    where public.viante_unit_invitations.status in ('pending','revoked')
  returning id into v_id;
  if v_id is null then
    raise exception 'invitation already accepted' using errcode='23505';
  end if;
  return v_id;
end
$$;
revoke all on function viante_private.invite_unit(uuid,uuid,text) from public,anon;
grant execute on function viante_private.invite_unit(uuid,uuid,text) to authenticated;
create or replace function public.viante_owner_invite_unit(p_org uuid,p_unit uuid,p_email text)
returns uuid language sql security invoker set search_path=''
as $$ select viante_private.invite_unit(p_org,p_unit,p_email) $$;
revoke all on function public.viante_owner_invite_unit(uuid,uuid,text) from public,anon;
grant execute on function public.viante_owner_invite_unit(uuid,uuid,text) to authenticated;

create or replace function viante_private.create_unit_with_invite(
  p_org uuid,p_name text,p_email text default null)
returns table(unit_id uuid,invitation_id uuid)
language plpgsql security definer set search_path=''
as $$
declare v_unit uuid;v_invite uuid;
begin
  perform viante_private.require_company_owner(p_org);
  if p_name is null or length(trim(p_name))<2 or length(trim(p_name))>160 then
    raise exception 'invalid unit name' using errcode='22023';
  end if;
  insert into public.viante_units(organization_id,name)
    values(p_org,trim(p_name)) returning id into v_unit;
  if nullif(trim(coalesce(p_email,'')),'') is not null then
    v_invite:=viante_private.invite_unit(p_org,v_unit,p_email);
  end if;
  return query select v_unit,v_invite;
end
$$;
revoke all on function viante_private.create_unit_with_invite(uuid,text,text) from public,anon;
grant execute on function viante_private.create_unit_with_invite(uuid,text,text) to authenticated;
create or replace function public.viante_owner_create_unit_with_invite(
  p_org uuid,p_name text,p_email text default null)
returns table(unit_id uuid,invitation_id uuid)
language sql security invoker set search_path=''
as $$ select * from viante_private.create_unit_with_invite(p_org,p_name,p_email) $$;
revoke all on function public.viante_owner_create_unit_with_invite(uuid,text,text) from public,anon;
grant execute on function public.viante_owner_create_unit_with_invite(uuid,text,text) to authenticated;

create or replace function viante_private.accept_unit_invitation(p_invitation_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid;v_email text;v_org uuid;v_unit uuid;v_status text;v_role text;
begin
  v_user:=auth.uid();
  if v_user is null or (auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'MFA required' using errcode='42501';
  end if;
  select lower(u.email) into v_email from auth.users u
    where u.id=v_user and u.email_confirmed_at is not null and u.is_anonymous is not true;
  if v_email is null then
    raise exception 'verified email required' using errcode='42501';
  end if;
  if exists(select 1 from public.viante_platform_admins a where a.user_id=v_user) then
    raise exception 'platform admins cannot be tenant members' using errcode='42501';
  end if;
  update public.viante_unit_invitations i set status='accepted',accepted_by=v_user,accepted_at=now()
    where i.id=p_invitation_id and i.status='pending' and i.expires_at>now()
      and i.email=v_email
    returning i.organization_id,i.unit_id into v_org,v_unit;
  if v_org is null then
    select i.organization_id,i.unit_id into v_org,v_unit
      from public.viante_unit_invitations i
      join public.viante_memberships m on m.organization_id=i.organization_id
        and m.user_id=v_user and m.status='active'
      join public.viante_unit_memberships um on um.unit_id=i.unit_id
        and um.organization_id=i.organization_id and um.user_id=v_user
      where i.id=p_invitation_id and i.status='accepted' and i.accepted_by=v_user;
    if v_org is null then
      raise exception 'invalid, expired or revoked invitation' using errcode='42501';
    end if;
    return v_org;
  end if;
  select role,status into v_role,v_status from public.viante_memberships
    where organization_id=v_org and user_id=v_user for update;
  if v_status='suspended' then
    raise exception 'suspended membership' using errcode='42501';
  end if;
  insert into public.viante_memberships(organization_id,user_id,role,status)
    values(v_org,v_user,'manager','active')
    on conflict(organization_id,user_id) do update set
      role=case when public.viante_memberships.role in ('owner','admin')
           then public.viante_memberships.role else 'manager' end,
      status='active'
      where public.viante_memberships.status<>'suspended';
  insert into public.viante_unit_memberships(organization_id,unit_id,user_id)
    values(v_org,v_unit,v_user) on conflict(unit_id,user_id) do nothing;
  return v_org;
end
$$;
revoke all on function viante_private.accept_unit_invitation(uuid) from public,anon;
grant execute on function viante_private.accept_unit_invitation(uuid) to authenticated;
create or replace function public.viante_accept_unit_invite(p_invitation_id uuid)
returns uuid language sql security invoker set search_path=''
as $$ select viante_private.accept_unit_invitation(p_invitation_id) $$;
revoke all on function public.viante_accept_unit_invite(uuid) from public,anon;
grant execute on function public.viante_accept_unit_invite(uuid) to authenticated;

create or replace function viante_private.list_unit_invites(p_org uuid)
returns table(id uuid,organization_id uuid,unit_id uuid,email text,status text,expires_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
  perform viante_private.require_company_owner(p_org);
  return query select i.id,i.organization_id,i.unit_id,i.email,i.status,i.expires_at
    from public.viante_unit_invitations i where i.organization_id=p_org
    order by i.created_at desc limit 250;
end
$$;
revoke all on function viante_private.list_unit_invites(uuid) from public,anon;
grant execute on function viante_private.list_unit_invites(uuid) to authenticated;
create or replace function public.viante_owner_unit_invites(p_org uuid)
returns table(id uuid,organization_id uuid,unit_id uuid,email text,status text,expires_at timestamptz)
language sql security invoker set search_path=''
as $$ select * from viante_private.list_unit_invites(p_org) $$;
revoke all on function public.viante_owner_unit_invites(uuid) from public,anon;
grant execute on function public.viante_owner_unit_invites(uuid) to authenticated;

create or replace function viante_private.revoke_unit_invite(p_org uuid,p_invite uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  perform viante_private.require_company_owner(p_org);
  update public.viante_unit_invitations set status='revoked'
    where id=p_invite and organization_id=p_org and status='pending';
  return found;
end
$$;
revoke all on function viante_private.revoke_unit_invite(uuid,uuid) from public,anon;
grant execute on function viante_private.revoke_unit_invite(uuid,uuid) to authenticated;
create or replace function public.viante_owner_revoke_unit_invite(p_org uuid,p_invite uuid)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.revoke_unit_invite(p_org,p_invite) $$;
revoke all on function public.viante_owner_revoke_unit_invite(uuid,uuid) from public,anon;
grant execute on function public.viante_owner_revoke_unit_invite(uuid,uuid) to authenticated;
