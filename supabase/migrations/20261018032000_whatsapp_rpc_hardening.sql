-- Keep the exposed PostgREST RPC SECURITY INVOKER (advisor 0028).
-- Restricted internal SECURITY DEFINER always verifies a 384-bit server-only secret.
alter function public.viante_ingest_whatsapp(text,text,text,text,text,text,text,bigint) security invoker;
grant usage on schema viante_private to anon;
grant execute on function viante_private.receive_whatsapp(text,text,text,text,text,text,text,bigint) to anon;
revoke all on public.viante_whatsapp_inbound from anon,authenticated;
grant select on public.viante_whatsapp_inbound to authenticated;
revoke all on public.viante_whatsapp_channels from anon,authenticated;
grant select on public.viante_whatsapp_channels to authenticated;
