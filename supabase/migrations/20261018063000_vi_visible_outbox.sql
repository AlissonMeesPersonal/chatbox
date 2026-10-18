-- Expose read-only Vi replies to users authorized for the corresponding unit.
-- Outbound tokens and private bot state remain inaccessible.
create or replace function viante_private.visible_vi_outbox()
returns table(id uuid,unit_id uuid,recipient text,message_body text,status text,created_at timestamptz,sent_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'login required' using errcode='42501'; end if;
  return query select o.id,i.unit_id,o.recipient,o.message_body,o.status,o.created_at,o.sent_at
  from viante_private.vi_outbox o
  join public.viante_whatsapp_inbound i on i.id=o.inbound_id
  where exists(select 1 from public.viante_memberships m
        where m.organization_id=i.organization_id and m.user_id=auth.uid()
        and m.status='active' and m.role in ('owner','admin'))
     or exists(select 1 from public.viante_unit_memberships um
        join public.viante_memberships m
          on m.organization_id=um.organization_id and m.user_id=um.user_id
        where um.organization_id=i.organization_id and um.unit_id=i.unit_id
          and um.user_id=auth.uid() and m.status='active')
  order by o.created_at desc limit 100;
end $$;
revoke all on function viante_private.visible_vi_outbox() from public,anon;
grant execute on function viante_private.visible_vi_outbox() to authenticated;
create or replace function public.viante_visible_vi_outbox()
returns table(id uuid,unit_id uuid,recipient text,message_body text,status text,created_at timestamptz,sent_at timestamptz)
language sql security invoker set search_path=''
as $$select * from viante_private.visible_vi_outbox()$$;
revoke all on function public.viante_visible_vi_outbox() from public,anon;
grant execute on function public.viante_visible_vi_outbox() to authenticated;