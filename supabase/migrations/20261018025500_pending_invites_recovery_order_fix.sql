create or replace function viante_private.my_pending_invitations()
returns table(invitation_id uuid, organization_name text, unit_name text, invitation_type text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare verified_email text;
begin
  if auth.uid() is null then
    raise exception 'authenticated session required' using errcode='42501';
  end if;
  select lower(u.email) into verified_email
  from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null and coalesce(u.is_anonymous,false) is false;
  if verified_email is null then
    raise exception 'confirmed email required' using errcode='42501';
  end if;
  if exists(select 1 from public.viante_platform_admins a where a.user_id=auth.uid()) then
    return;
  end if;
  return query
    select i.id, o.name, null::text, 'owner'::text, i.expires_at
    from public.viante_invitations i join public.viante_organizations o on o.id=i.organization_id
    where i.email=verified_email and i.status='pending' and i.expires_at>now()
    union all
    select i.id, o.name, u.name, 'unit'::text, i.expires_at
    from public.viante_unit_invitations i
    join public.viante_organizations o on o.id=i.organization_id
    join public.viante_units u on u.id=i.unit_id and u.organization_id=i.organization_id
    where i.email=verified_email and i.status='pending' and i.expires_at>now()
    order by 5 asc limit 20;
end $$;