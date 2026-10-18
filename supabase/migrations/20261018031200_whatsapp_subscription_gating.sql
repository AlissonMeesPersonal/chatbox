create or replace function viante_private.owner_disable_whatsapp_channel(p_org uuid,p_phone_id text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  perform viante_private.require_company_owner(p_org);
  update public.viante_whatsapp_channels c set status='disabled'
    where c.organization_id=p_org and c.phone_number_id=p_phone_id;
  return found;
end $$;
revoke all on function viante_private.owner_disable_whatsapp_channel(uuid,text) from public,anon;
grant execute on function viante_private.owner_disable_whatsapp_channel(uuid,text) to authenticated;

create or replace function public.viante_owner_disable_whatsapp_channel(p_org uuid,p_phone_id text)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.owner_disable_whatsapp_channel(p_org,p_phone_id) $$;
revoke all on function public.viante_owner_disable_whatsapp_channel(uuid,text) from public,anon;
grant execute on function public.viante_owner_disable_whatsapp_channel(uuid,text) to authenticated;