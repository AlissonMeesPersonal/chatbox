-- VIANTE PHASE 3: opt-in menu responder, isolated by Cloud API phone_number_id.
-- Outbound WhatsApp tokens NEVER stored in public tables. The first-number pilot
-- uses a server-only Vercel credential and a matching test phone number ID.
alter table public.viante_whatsapp_channels
  add column if not exists vi_enabled boolean not null default false,
  add column if not exists vi_enabled_at timestamptz;

create table if not exists viante_private.vi_chat_state (
  channel_id uuid not null references public.viante_whatsapp_channels(id) on delete cascade,
  customer_wa_id text not null,
  phase text not null default 'menu'
    check(phase in ('menu','handoff','stopped')),
  updated_at timestamptz not null default now(),
  primary key(channel_id,customer_wa_id)
);
revoke all on viante_private.vi_chat_state from public, anon, authenticated;

create table if not exists viante_private.vi_outbox (
  id uuid primary key default gen_random_uuid(),
  inbound_id uuid not null unique references public.viante_whatsapp_inbound(id) on delete cascade,
  channel_id uuid not null references public.viante_whatsapp_channels(id) on delete cascade,
  recipient text not null,
  message_body text not null check(length(message_body) between 1 and 3500),
  status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  meta_outbound_message_id text,
  created_at timestamptz not null default now()
);
create index if not exists vi_outbox_status on viante_private.vi_outbox(status,created_at);
revoke all on viante_private.vi_outbox from public,anon,authenticated;

create or replace function viante_private.pilot_secret_valid(p_secret text)
returns boolean language sql security definer set search_path=''
as $$
  select p_secret is not null and length(p_secret)>=64
    and exists(select 1 from viante_private.webhook_ingest_secret s
      where s.id=1 and s.digest_hex=encode(sha256(convert_to(p_secret,'UTF8')),'hex'))
$$;
revoke all on function viante_private.pilot_secret_valid(text) from public,anon,authenticated;
grant execute on function viante_private.pilot_secret_valid(text) to anon;

-- The owner can enable Vi ONLY for a real, active channel registered to that same company.
create or replace function viante_private.owner_set_vi(p_org uuid,p_channel uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  perform viante_private.require_company_owner(p_org);
  if p_enabled is null then raise exception 'boolean required' using errcode='22023'; end if;
  update public.viante_whatsapp_channels c
    set vi_enabled=p_enabled,vi_enabled_at=case when p_enabled then now() else null end
    where c.id=p_channel and c.organization_id=p_org and c.status='connected';
  return found;
end;
$$;
revoke all on function viante_private.owner_set_vi(uuid,uuid,boolean) from public,anon;
grant execute on function viante_private.owner_set_vi(uuid,uuid,boolean) to authenticated;
create or replace function public.viante_owner_set_vi(p_org uuid,p_channel uuid,p_enabled boolean)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.owner_set_vi(p_org,p_channel,p_enabled) $$;
revoke all on function public.viante_owner_set_vi(uuid,uuid,boolean) from public,anon;
grant execute on function public.viante_owner_set_vi(uuid,uuid,boolean) to authenticated;

-- A single new inbound message may generate a single outbox entry.
-- The private function checks a high-entropy server secret before looking up data.
create or replace function viante_private.vi_prepare(
  p_secret text, p_phone text, p_inbound_meta_id text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  msg record; ch record; state text; command text; reply text; next_phase text;
begin
  if not viante_private.pilot_secret_valid(p_secret) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  select c.id,c.organization_id,c.unit_id,c.vi_enabled,c.status
    into ch from public.viante_whatsapp_channels c
    where c.phone_number_id=p_phone and c.vi_enabled and c.status='connected';
  if not found then return false; end if;
  select i.id,i.customer_wa_id,i.message_text,i.message_type into msg
    from public.viante_whatsapp_inbound i
    where i.channel_id=ch.id and i.meta_message_id=p_inbound_meta_id;
  if not found or msg.message_type not in ('text','button','interactive')
    or length(trim(coalesce(msg.message_text,'')))=0 then return false; end if;
  if exists(select 1 from viante_private.vi_outbox o where o.inbound_id=msg.id) then
    return true;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(ch.id::text||'/'||msg.customer_wa_id,0));
  if exists(select 1 from viante_private.vi_outbox o where o.inbound_id=msg.id) then return true; end if;
  insert into viante_private.vi_chat_state(channel_id,customer_wa_id)
    values(ch.id,msg.customer_wa_id) on conflict do nothing;
  select s.phase into state from viante_private.vi_chat_state s
    where s.channel_id=ch.id and s.customer_wa_id=msg.customer_wa_id for update;
  command:=lower(trim(coalesce(msg.message_text,'')));
  next_phase:=state;

  if command in ('parar','sair','stop','não','nao quero receber','cancelar mensagens') then
    reply:='Entendido! A Vi não responderá mais automaticamente. Para reativar o menu, envie MENU.';
    next_phase:='stopped';
  elsif state='stopped' then
    if command in ('menu','iniciar','começar','comecar') then
      next_phase:='menu';
      reply:='Olá! Sou a Vi, assistente virtual da unidade. Como posso ajudar?'||
        E'\n\n1 · Saber sobre planos\n2 · Cancelamento\n3 · Falar com a unidade\n\nDigite uma opção ou PARAR para não receber respostas automáticas.';
    else return false;
    end if;
  elsif state='handoff' then
    if command in ('menu','iniciar','voltar') then
      next_phase:='menu';
      reply:='Olá! Sou a Vi. Escolha uma opção:'||
        E'\n1 · Saber sobre planos\n2 · Cancelamento\n3 · Falar com a unidade';
    else
      -- Human handoff stays quiet rather than intercepting a staff conversation.
      return false;
    end if;
  elsif command in ('1','planos','plano','preços','precos') then
    reply:='Vou encaminhar sua solicitação sobre planos à equipe da unidade. Aguarde o atendimento humano, por favor. Para voltar ao menu, envie MENU.';
    next_phase:='handoff';
  elsif command in ('2','cancelamento','cancelar','cancelamento do plano') then
    reply:='Entendi. Vou encaminhar seu pedido à equipe responsável. Para sua segurança, não envie CPF ou dados financeiros neste chat de teste. Para voltar ao menu, envie MENU.';
    next_phase:='handoff';
  elsif command in ('3','atendente','humano','falar com unidade','falar com a unidade') then
    reply:='Certo! Vou direcionar a conversa para a equipe da unidade. A Vi aguardará em silêncio. Para voltar ao menu, envie MENU.';
    next_phase:='handoff';
  else
    reply:='Olá! Sou a Vi, assistente virtual da unidade. Como posso ajudar?'||
      E'\n\n1 · Saber sobre planos\n2 · Cancelamento\n3 · Falar com a unidade\n\nDigite uma opção ou PARAR para não receber respostas automáticas.';
  end if;

  update viante_private.vi_chat_state s
    set phase=next_phase,updated_at=now()
    where s.channel_id=ch.id and s.customer_wa_id=msg.customer_wa_id;
  if reply is not null then
    insert into viante_private.vi_outbox(inbound_id,channel_id,recipient,message_body)
      values(msg.id,ch.id,msg.customer_wa_id,reply) on conflict(inbound_id) do nothing;
  end if;
  return reply is not null;
end $$;
revoke all on function viante_private.vi_prepare(text,text,text) from public,anon,authenticated;
grant execute on function viante_private.vi_prepare(text,text,text) to anon;
create or replace function public.viante_vi_prepare(p_secret text,p_phone text,p_inbound_meta_id text)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.vi_prepare(p_secret,p_phone,p_inbound_meta_id) $$;
revoke all on function public.viante_vi_prepare(text,text,text) from public,authenticated;
grant execute on function public.viante_vi_prepare(text,text,text) to anon;

-- Claim with short lease. Meta may retry webhooks; deterministic single outbox ID
-- prevents ordinary duplicate replies. Still an at-least-once delivery boundary.
create or replace function viante_private.vi_claim(p_secret text,p_phone text,p_meta_id text)
returns table(outbox_id uuid,recipient text,message_body text)
language plpgsql security definer set search_path=''
as $$
begin
  if not viante_private.pilot_secret_valid(p_secret) then raise exception 'forbidden' using errcode='42501'; end if;
  return query
    with claim as (
      update viante_private.vi_outbox o set status='sending',attempts=o.attempts+1,last_attempt_at=now()
      where o.id=(
        select queue.id from viante_private.vi_outbox queue
        join public.viante_whatsapp_inbound i on queue.inbound_id=i.id
        join public.viante_whatsapp_channels c on queue.channel_id=c.id
        where i.meta_message_id=p_meta_id and c.phone_number_id=p_phone
          and c.vi_enabled and c.status='connected' and queue.attempts<3
          and (queue.status='pending'
            or (queue.status='sending' and queue.last_attempt_at<now()-interval '3 minutes'))
        order by queue.created_at
        limit 1 for update of queue skip locked
      ) returning o.id,o.recipient,o.message_body
    ) select claim.id, claim.recipient,claim.message_body from claim;
end $$;
revoke all on function viante_private.vi_claim(text,text,text) from public,anon,authenticated;
grant execute on function viante_private.vi_claim(text,text,text) to anon;
create or replace function public.viante_vi_claim(p_secret text,p_phone text,p_meta_id text)
returns table(outbox_id uuid,recipient text,message_body text)
language sql security invoker set search_path=''
as $$ select * from viante_private.vi_claim(p_secret,p_phone,p_meta_id) $$;
revoke all on function public.viante_vi_claim(text,text,text) from public,authenticated;
grant execute on function public.viante_vi_claim(text,text,text) to anon;

create or replace function viante_private.vi_ack(p_secret text,p_outbox_id uuid,p_success boolean,p_meta_sent_id text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  if not viante_private.pilot_secret_valid(p_secret) then raise exception 'forbidden' using errcode='42501'; end if;
  update viante_private.vi_outbox o
  set status=case when p_success then 'sent' when o.attempts>=3 then 'failed' else 'pending' end,
      sent_at=case when p_success then now() else null end,
      meta_outbound_message_id=case when p_success then left(coalesce(p_meta_sent_id,''),255) else null end
  where o.id=p_outbox_id and o.status='sending';
  return found;
end $$;
revoke all on function viante_private.vi_ack(text,uuid,boolean,text) from public,anon,authenticated;
grant execute on function viante_private.vi_ack(text,uuid,boolean,text) to anon;
create or replace function public.viante_vi_ack(p_secret text,p_outbox_id uuid,p_success boolean,p_meta_sent_id text)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.vi_ack(p_secret,p_outbox_id,p_success,p_meta_sent_id) $$;
revoke all on function public.viante_vi_ack(text,uuid,boolean,text) from public,authenticated;
grant execute on function public.viante_vi_ack(text,uuid,boolean,text) to anon;
