-- Viante tenant owner invitations. Deployed to Supabase project idmqygvbtofkmbccazyp.
-- Prerequisites: tenant foundation, private schema, CEO bootstrap, MFA claim RPC.
create table if not exists public.viante_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  email text not null,
  role text not null default 'owner' check(role in ('owner')),
  status text not null default 'pending' check(status in ('pending','accepted','revoked')),
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '7 days'),
  accepted_at timestamptz,
  unique (organization_id,email),
  constraint viante_invites_email_normalized check(email=lower(trim(email)) and length(email) between 5 and 254)
);
alter table public.viante_invitations enable row level security;
revoke all on public.viante_invitations from public, anon, authenticated;
-- No direct access, only validated RPC calls.
create policy viante_invitations_no_direct_read on public.viante_invitations
  for select to authenticated using (false);
grant usage on schema viante_private to authenticated;

CREATE OR REPLACE FUNCTION viante_private.require_ceo()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null
  or (auth.jwt()->>'aal') is distinct from 'aal2'
  or not exists(select 1 from public.viante_platform_admins a where a.user_id=auth.uid()) then
    raise exception 'forbidden' using errcode='42501';
  end if;
end
$function$
revoke all on function viante_private.require_ceo() from public, anon;
grant execute on function viante_private.require_ceo() to authenticated;

CREATE OR REPLACE FUNCTION viante_private.ceo_invite_owner(p_organization_id uuid, p_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_email text; v_id uuid;
begin
  perform viante_private.require_ceo();
  v_email:=lower(trim(p_email));
  if length(v_email)>254 or length(v_email)<5 or
     v_email !~ '^[^ @[:space:]]+@[^ @[:space:]]+[.][^ @[:space:]]+$' then
    raise exception 'invalid email' using errcode='22023';
  end if;
  if not exists(select 1 from public.viante_organizations where id=p_organization_id) then
    raise exception 'organization not found' using errcode='22023';
  end if;
  insert into public.viante_invitations (organization_id,email,invited_by)
  values (p_organization_id,v_email,auth.uid())
  on conflict (organization_id,email) do update
    set expires_at=now()+interval '7 days',created_at=now(),
    invited_by=auth.uid(),status='pending'
    where public.viante_invitations.status='pending'
  returning id into v_id;
  if v_id is null then raise exception 'already accepted or revoked' using errcode='23505'; end if;
  return v_id;
end
$function$
revoke all on function viante_private.ceo_invite_owner(p_organization_id uuid, p_email text) from public, anon;
grant execute on function viante_private.ceo_invite_owner(p_organization_id uuid, p_email text) to authenticated;

CREATE OR REPLACE FUNCTION viante_private.ceo_invitations()
 RETURNS TABLE(id uuid, organization_id uuid, email text, status text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform viante_private.require_ceo();
  return query select i.id,i.organization_id,i.email,i.status,i.expires_at
  from public.viante_invitations i order by i.created_at desc limit 200;
end
$function$
revoke all on function viante_private.ceo_invitations() from public, anon;
grant execute on function viante_private.ceo_invitations() to authenticated;

CREATE OR REPLACE FUNCTION viante_private.accept_invite(p_invitation_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid;v_email text; v_org uuid;
begin
  v_user:=auth.uid();
  if v_user is null or (auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'MFA required' using errcode='42501';
  end if;
  select lower(u.email) into v_email
  from auth.users u where u.id=v_user and u.email_confirmed_at is not null and u.is_anonymous is not true;
  if v_email is null then raise exception 'email not verified' using errcode='42501'; end if;
  if exists(select 1 from public.viante_platform_admins where user_id=v_user) then
    raise exception 'platform administrator cannot join a tenant' using errcode='42501';
  end if;
  update public.viante_invitations i
  set status='accepted',accepted_by=v_user,accepted_at=now()
  where i.id=p_invitation_id and i.status='pending' and i.expires_at>now() and i.email=v_email
  returning organization_id into v_org;
  if v_org is null then
    select i.organization_id into v_org from public.viante_invitations i
    where i.id=p_invitation_id and i.status='accepted' and i.accepted_by=v_user;
    if v_org is null then
      raise exception 'Invitation invalid, expired or email mismatch' using errcode='42501';
    end if;
  end if;
  insert into public.viante_memberships (organization_id,user_id,role,status)
  values(v_org,v_user,'owner','active')
  on conflict (organization_id,user_id) do update set role='owner',status='active';
  return v_org;
end
$function$
revoke all on function viante_private.accept_invite(p_invitation_id uuid) from public, anon;
grant execute on function viante_private.accept_invite(p_invitation_id uuid) to authenticated;

CREATE OR REPLACE FUNCTION viante_private.owner_create_unit(p_organization_id uuid, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if auth.uid() is null or (auth.jwt()->>'aal') is distinct from 'aal2' or
  not exists(select 1 from public.viante_memberships m where m.organization_id=p_organization_id
    and m.user_id=auth.uid() and m.status='active' and m.role in('owner','admin')) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  if length(trim(p_name))<2 or length(trim(p_name))>160 then
    raise exception 'invalid unit name' using errcode='22023';
  end if;
  insert into public.viante_units(organization_id,name)
  values(p_organization_id,trim(p_name)) returning id into v_id;
  return v_id;
end
$function$
revoke all on function viante_private.owner_create_unit(p_organization_id uuid, p_name text) from public, anon;
grant execute on function viante_private.owner_create_unit(p_organization_id uuid, p_name text) to authenticated;

CREATE OR REPLACE FUNCTION public.viante_ceo_invite_owner(p_organization_id uuid, p_email text)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select viante_private.ceo_invite_owner(p_organization_id,p_email) $function$
revoke all on function public.viante_ceo_invite_owner(p_organization_id uuid, p_email text) from public, anon;
grant execute on function public.viante_ceo_invite_owner(p_organization_id uuid, p_email text) to authenticated;

CREATE OR REPLACE FUNCTION public.viante_ceo_invitations()
 RETURNS TABLE(id uuid, organization_id uuid, email text, status text, expires_at timestamp with time zone)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from viante_private.ceo_invitations() $function$
revoke all on function public.viante_ceo_invitations() from public, anon;
grant execute on function public.viante_ceo_invitations() to authenticated;

CREATE OR REPLACE FUNCTION public.viante_accept_invite(p_invitation_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select viante_private.accept_invite(p_invitation_id) $function$
revoke all on function public.viante_accept_invite(p_invitation_id uuid) from public, anon;
grant execute on function public.viante_accept_invite(p_invitation_id uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.viante_owner_create_unit(p_organization_id uuid, p_name text)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select viante_private.owner_create_unit(p_organization_id,p_name) $function$
revoke all on function public.viante_owner_create_unit(p_organization_id uuid, p_name text) from public, anon;
grant execute on function public.viante_owner_create_unit(p_organization_id uuid, p_name text) to authenticated;
