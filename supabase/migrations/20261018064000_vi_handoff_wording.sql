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
    reply:='Recebi seu interesse nos planos. A Vi vai pausar as respostas automáticas para que uma pessoa possa continuar o atendimento no WhatsApp Business. Envie MENU para voltar às opções.';
    next_phase:='handoff';
  elsif command in ('2','cancelamento','cancelar','cancelamento do plano') then
    reply:='Entendi seu pedido de cancelamento. A Vi pausará as respostas automáticas para atendimento humano pelo WhatsApp Business. Não compartilhe CPF ou dados financeiros no teste. Envie MENU para voltar.';
    next_phase:='handoff';
  elsif command in ('3','atendente','humano','falar com unidade','falar com a unidade') then
    reply:='Certo! A Vi ficará em silêncio para você conversar com uma pessoa. Neste piloto, o responsável poderá responder pelo WhatsApp Business. Envie MENU para voltar ao menu.';
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
