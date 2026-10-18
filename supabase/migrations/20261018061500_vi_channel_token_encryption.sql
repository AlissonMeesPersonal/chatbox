-- Secure, per-channel OAuth token storage for official Meta Embedded Signup.
-- AES-256-GCM encryption happens exclusively inside Next.js. The encryption key is
-- separate from the random DB ingestion secret and exists only on Vercel.
create table if not exists viante_private.vi_channel_tokens (
  channel_id uuid primary key references public.viante_whatsapp_channels(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  tag text not null,
  updated_at timestamptz not null default now(),
  constraint enc_fields_check check (
    length(ciphertext) between 36 and 8192 and
    length(iv) between 12 and 128 and length(tag) between 12 and 128
  )
);
revoke all on viante_private.vi_channel_tokens from public,anon,authenticated;
alter table public.viante_whatsapp_channels add column if not exists vi_token_ready boolean not null default false;

create or replace function viante_private.vi_store_token(
  p_secret text,p_phone text,p_ciphertext text,p_iv text,p_tag text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_channel uuid;
begin
  if not viante_private.pilot_secret_valid(p_secret) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  if p_ciphertext is null or length(p_ciphertext) not between 36 and 8192
    or p_iv is null or length(p_iv) not between 12 and 128
    or p_tag is null or length(p_tag) not between 12 and 128 then
    raise exception 'invalid encrypted token shape' using errcode='22023';
  end if;
  select c.id into v_channel from public.viante_whatsapp_channels c
    where c.phone_number_id=p_phone and c.status='connected';
  if v_channel is null then return false; end if;
  insert into viante_private.vi_channel_tokens(channel_id,ciphertext,iv,tag)
    values(v_channel,p_ciphertext,p_iv,p_tag)
    on conflict(channel_id) do update
    set ciphertext=excluded.ciphertext,iv=excluded.iv,tag=excluded.tag,updated_at=now();
  update public.viante_whatsapp_channels c set vi_token_ready=true where c.id=v_channel;
  return true;
end $$;
revoke all on function viante_private.vi_store_token(text,text,text,text,text) from public,anon,authenticated;
grant execute on function viante_private.vi_store_token(text,text,text,text,text) to anon;
create or replace function public.viante_vi_store_token(
  p_secret text,p_phone text,p_ciphertext text,p_iv text,p_tag text)
returns boolean language sql security invoker set search_path=''
as $$ select viante_private.vi_store_token(p_secret,p_phone,p_ciphertext,p_iv,p_tag) $$;
revoke all on function public.viante_vi_store_token(text,text,text,text,text) from public,authenticated;
grant execute on function public.viante_vi_store_token(text,text,text,text,text) to anon;

create or replace function viante_private.vi_get_token(p_secret text,p_phone text)
returns table(ciphertext text,iv text,tag text)
language plpgsql security definer set search_path=''
as $$
begin
  if not viante_private.pilot_secret_valid(p_secret) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  return query select t.ciphertext,t.iv,t.tag
    from viante_private.vi_channel_tokens t
    join public.viante_whatsapp_channels c on c.id=t.channel_id
    where c.phone_number_id=p_phone and c.status='connected'
      and c.vi_enabled=true and c.vi_token_ready=true limit 1;
end $$;
revoke all on function viante_private.vi_get_token(text,text) from public,anon,authenticated;
grant execute on function viante_private.vi_get_token(text,text) to anon;
create or replace function public.viante_vi_get_token(p_secret text,p_phone text)
returns table(ciphertext text,iv text,tag text)
language sql security invoker set search_path=''
as $$ select * from viante_private.vi_get_token(p_secret,p_phone) $$;
revoke all on function public.viante_vi_get_token(text,text) from public,authenticated;
grant execute on function public.viante_vi_get_token(text,text) to anon;
