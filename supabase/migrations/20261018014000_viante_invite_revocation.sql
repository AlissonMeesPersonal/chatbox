-- Amend invitation lifecycle: rotate invite ID on resends, allow revocation,
-- and ensure a used invitation cannot reactivate a suspended owner.
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
    set id=gen_random_uuid(),expires_at=now()+interval '7 days',created_at=now(),
    invited_by=auth.uid(),status='pending',accepted_by=null,accepted_at=null
    where public.viante_invitations.status in ('pending','revoked')
  returning id into v_id;
  if v_id is null then raise exception 'already accepted' using errcode='23505'; end if;
  return v_id;
end
$function$;
revoke all on function viante_private.ceo_invite_owner(p_organization_id uuid, p_email text) from public, anon;
grant execute on function viante_private.ceo_invite_owner(p_organization_id uuid, p_email text) to authenticated;

CREATE OR REPLACE FUNCTION viante_private.ceo_revoke_invite(p_invitation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform viante_private.require_ceo();
  update public.viante_invitations
  set status='revoked'
  where id=p_invitation_id and status='pending';
  return found;
end
$function$;
revoke all on function viante_private.ceo_revoke_invite(p_invitation_id uuid) from public, anon;
grant execute on function viante_private.ceo_revoke_invite(p_invitation_id uuid) to authenticated;

CREATE OR REPLACE FUNCTION viante_private.accept_invite(p_invitation_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid;v_email text;v_org uuid;
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
    -- Repeated clicks may succeed only for memberships that are STILL active owners.
    -- Never resurrect suspended users using an old accepted invitation.
    select i.organization_id into v_org from public.viante_invitations i
    join public.viante_memberships m on m.organization_id=i.organization_id
      and m.user_id=v_user and m.status='active' and m.role='owner'
    where i.id=p_invitation_id and i.status='accepted' and i.accepted_by=v_user;
    if v_org is null then
      raise exception 'Invitation invalid, expired, revoked, or membership suspended' using errcode='42501';
    end if;
    return v_org;
  end if;
  insert into public.viante_memberships (organization_id,user_id,role,status)
  values(v_org,v_user,'owner','active')
  on conflict (organization_id,user_id) do update set role='owner',status='active';
  return v_org;
end
$function$;
revoke all on function viante_private.accept_invite(p_invitation_id uuid) from public, anon;
grant execute on function viante_private.accept_invite(p_invitation_id uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.viante_ceo_revoke_invite(p_invitation_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select viante_private.ceo_revoke_invite(p_invitation_id) $function$;
revoke all on function public.viante_ceo_revoke_invite(p_invitation_id uuid) from public, anon;
grant execute on function public.viante_ceo_revoke_invite(p_invitation_id uuid) to authenticated;
