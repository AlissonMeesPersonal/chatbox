-- Viante Meta WhatsApp Cloud API - inbound-only testing channel.
-- Only authorized tenant owners/admins can register and see their unit channels.
create table if not exists public.viante_whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  unit_id uuid not null,
  waba_id text not null check (waba_id ~ '^[0-9]{5,30}$'),
  phone_number_id text not null unique check (phone_number_id ~ '^[0-9]{5,30}$'),
  display_phone_number text not null,
  verified_name text,
  status text not null default 'connected' check(status in ('connected','disabled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint viante_whatsapp_channel_unit_fk
    foreign key(unit_id,organization_id) references public.viante_units(id,organization_id) on delete cascade
);
alter table public.viante_whatsapp_channels enable row level security;
revoke all on public.viante_whatsapp_channels from public, anon;
grant select on public.viante_whatsapp_channels to authenticated;
create policy viante_whatsapp_channels_scoped_read
  on public.viante_whatsapp_channels for select to authenticated
  using (
    exists(select 1 from public.viante_memberships m
      where m.organization_id=viante_whatsapp_channels.organization_id
        and m.user_id=(select auth.uid()) and m.status='active'
        and m.role in ('owner','admin'))
    or exists(select 1 from public.viante_unit_memberships um
      join public.viante_memberships m
        on m.organization_id=um.organization_id and m.user_id=um.user_id
      where um.unit_id=viante_whatsapp_channels.unit_id
        and um.organization_id=viante_whatsapp_channels.organization_id
        and um.user_id=(select auth.uid()) and m.status='active')
  );
create table if not exists public.viante_whatsapp_inbound (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.viante_whatsapp_channels(id) on delete cascade,
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  unit_id uuid not null,
  meta_message_id text not null unique,
  customer_wa_id text not null,
  sender_name text,
  message_type text not null,
  message_text text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint viante_whatsapp_inbound_unit_fk
    foreign key(unit_id,organization_id) references public.viante_units(id,organization_id) on delete cascade
);
create index if not exists viante_whatsapp_inbound_unit_time
  on public.viante_whatsapp_inbound(unit_id,received_at desc);
alter table public.viante_whatsapp_inbound enable row level security;
revoke all on public.viante_whatsapp_inbound from public,anon;
grant select on public.viante_whatsapp_inbound to authenticated;
create policy viante_whatsapp_inbound_unit_read on public.viante_whatsapp_inbound
  for select to authenticated using (
    exists(select 1 from public.viante_memberships m
      where m.organization_id=viante_whatsapp_inbound.organization_id
        and m.user_id=(select auth.uid()) and m.status='active'
        and m.role in ('owner','admin'))
    or exists(select 1 from public.viante_unit_memberships um
      join public.viante_memberships m
        on m.organization_id=um.organization_id and m.user_id=um.user_id
      where um.unit_id=viante_whatsapp_inbound.unit_id
        and um.organization_id=viante_whatsapp_inbound.organization_id
        and um.user_id=(select auth.uid()) and m.status='active')
  );

create table if not exists viante_private.webhook_ingest_secret (
  id smallint primary key default 1 check(id=1),
  digest_hex text not null,
  updated_at timestamptz not null default now()
);
revoke all on viante_private.webhook_ingest_secret from public,anon,authenticated;

create or replace function viante_private.register_whatsapp_channel(
  p_org uuid,p_unit uuid,p_waba_id text,p_phone_id text,p_display text,p_verified text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  perform viante_private.require_company_owner(p_org);
  if not exists(select 1 from public.viante_units u
    where u.id=p_unit and u.organization_id=p_org) then
    raise exception 'unrecognized company unit' using errcode='42501';
  end if;
  if p_waba_id !~ '^[0-9]{5,30}$' or p_phone_id !~ '^[0-9]{5,30}$'
     or p_display is null or length(p_display) > 60
     or length(coalesce(p_verified,''))>160 then
    raise exception 'invalid WhatsApp channel attributes' using errcode='22023';
  end if;
  -- Number is exclusive to one tenant/unit; never allow silently transferring it.
  insert into public.viante_whatsapp_channels
    (organization_id,unit_id,waba_id,phone_number_id,display_phone_number,verified_name,created_by)
  values(p_org,p_unit,p_waba_id,p_phone_id,p_display,p_verified,auth.uid())
  on conflict (phone_number_id) do update
    set verified_name=excluded.verified_name,display_phone_number=excluded.display_phone_number,
      status='connected'
    where public.viante_whatsapp_channels.organization_id=p_org
      and public.viante_whatsapp_channels.unit_id=p_unit
      and public.viante_whatsapp_channels.waba_id=p_waba_id
  returning id into v_id;
  if v_id is null then raise exception 'number already assigned to another tenant or unit' using errcode='23505'; end if;
  return v_id;
end
$$;
revoke all on function viante_private.register_whatsapp_channel(uuid,uuid,text,text,text,text) from public,anon;
grant execute on function viante_private.register_whatsapp_channel(uuid,uuid,text,text,text,text) to authenticated;
create or replace function public.viante_owner_register_whatsapp_channel(
  p_org uuid,p_unit uuid,p_waba_id text,p_phone_id text,p_display text,p_verified text)
returns uuid language sql security invoker set search_path=''
as $$ select viante_private.register_whatsapp_channel(p_org,p_unit,p_waba_id,p_phone_id,p_display,p_verified) $$;
revoke all on function public.viante_owner_register_whatsapp_channel(uuid,uuid,text,text,text,text) from public,anon;
grant execute on function public.viante_owner_register_whatsapp_channel(uuid,uuid,text,text,text,text) to authenticated;

create or replace function viante_private.receive_whatsapp(
  p_ingest_secret text,p_phone_id text,p_message_id text,p_sender text,
  p_name text,p_type text,p_text text,p_timestamp bigint)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_channel record; v_expected text; v_received_at timestamptz;
begin
  -- Authentication is independent of user sessions: the Meta POST route checks
  -- HMAC-SHA256 against META_APP_SECRET and supplies the dedicated server secret.
  select s.digest_hex into v_expected from viante_private.webhook_ingest_secret s where id=1;
  if v_expected is null or p_ingest_secret is null or
    encode(sha256(convert_to(p_ingest_secret,'UTF8')),'hex')<>v_expected then
    raise exception 'unauthorized webhook' using errcode='42501';
  end if;
  if p_message_id is null or length(p_message_id) not between 1 and 255
     or p_phone_id !~ '^[0-9]{5,30}$'
     or p_sender is null or length(p_sender)>45
     or length(coalesce(p_text,''))>4000 or length(coalesce(p_name,''))>180
     or length(coalesce(p_type,''))>50 then
    raise exception 'invalid webhook payload' using errcode='22023';
  end if;
  select c.id,c.organization_id,c.unit_id into v_channel
    from public.viante_whatsapp_channels c
    where c.phone_number_id=p_phone_id and c.status='connected';
  if not found then return false; end if;
  if p_timestamp is null or p_timestamp<946684800
     or p_timestamp>extract(epoch from now()+interval '1 day') then
    v_received_at:=now();
  else
    v_received_at:=to_timestamp(p_timestamp);
  end if;
  insert into public.viante_whatsapp_inbound
    (channel_id,organization_id,unit_id,meta_message_id,customer_wa_id,
     sender_name,message_type,message_text,received_at)
  values(v_channel.id,v_channel.organization_id,v_channel.unit_id,p_message_id,
     p_sender,p_name,coalesce(p_type,'unknown'),p_text,v_received_at)
  on conflict(meta_message_id) do nothing;
  return true;
end
$$;
revoke all on function viante_private.receive_whatsapp(text,text,text,text,text,text,text,bigint) from public,anon,authenticated;
-- A high-entropy secret stored only on Vercel gates the anon RPC; private SHA-256 digest is DB-only.
create or replace function public.viante_ingest_whatsapp(
  p_ingest_secret text,p_phone_id text,p_message_id text,p_sender text,
  p_name text,p_type text,p_text text,p_timestamp bigint)
returns boolean language sql security definer set search_path=''
as $$ select viante_private.receive_whatsapp(p_ingest_secret,p_phone_id,p_message_id,p_sender,p_name,p_type,p_text,p_timestamp) $$;
revoke all on function public.viante_ingest_whatsapp(text,text,text,text,text,text,text,bigint) from public,authenticated;
grant execute on function public.viante_ingest_whatsapp(text,text,text,text,text,text,text,bigint) to anon;
