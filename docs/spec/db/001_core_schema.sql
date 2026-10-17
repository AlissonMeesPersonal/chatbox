-- VIANTE v2.0 — SQL DE REFERÊNCIA PARA STAGING (NÃO APLICADO).
-- Supabase PostgreSQL; revisão de segurança/migração obrigatória antes de produção.
-- Esquema inicial do núcleo. Campanhas e anexos serão migrados em fases posteriores.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 2 and 160),
  slug text not null unique,
  status text not null default 'trial' check(status in ('trial','active','suspended','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('tenant_admin','network_manager','unit_manager','supervisor','agent','finance_agent','auditor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id,user_id)
);
create index if not exists tenant_memberships_user_idx on public.tenant_memberships(user_id,active);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id,id)
);
create index if not exists units_tenant_idx on public.units(tenant_id,name);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  unique (tenant_id,id),
  unique (tenant_id,name)
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid not null,
  unit_id uuid null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id,id),
  foreign key(tenant_id,department_id) references public.departments(tenant_id,id),
  foreign key(tenant_id,unit_id) references public.units(tenant_id,id)
);
create index if not exists queues_scope_idx on public.queues(tenant_id,department_id,unit_id);

-- Uma concessão de permissão pode valer para toda a empresa (IDs nulos),
-- para uma unidade/setor, ou para uma fila específica.
-- Aplicação deve validar que fila pertence ao setor/unidade do grant, quando preenchidos.
create table if not exists public.member_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  unit_id uuid null,
  department_id uuid null,
  queue_id uuid null,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(tenant_id,id),
  foreign key(tenant_id,user_id) references public.tenant_memberships(tenant_id,user_id) on delete cascade,
  foreign key(tenant_id,unit_id) references public.units(tenant_id,id),
  foreign key(tenant_id,department_id) references public.departments(tenant_id,id),
  foreign key(tenant_id,queue_id) references public.queues(tenant_id,id)
);
create index if not exists member_grants_user_idx on public.member_grants(tenant_id,user_id);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null check(provider in ('whatsapp_cloud','webchat','email','instagram','messenger')),
  external_channel_id text not null,
  display_name text not null,
  status text not null default 'pending' check(status in ('pending','connected','degraded','disconnected')),
  created_at timestamptz not null default now(),
  unique(provider,external_channel_id),
  unique(tenant_id,id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  display_name text,
  phone_e164 text check(phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  identity_status text not null default 'unverified' check(identity_status in ('unverified','phone_match','verified','sensitive_verified')),
  created_at timestamptz not null default now(),
  unique(tenant_id,id)
);
create unique index if not exists contacts_tenant_phone_unique on public.contacts(tenant_id,phone_e164) where phone_e164 is not null;

create table if not exists public.contact_external_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contact_id uuid not null,
  provider text not null,
  external_id text not null,
  unit_id uuid null,
  identity_verified_at timestamptz null,
  unique(tenant_id,provider,external_id),
  foreign key(tenant_id,contact_id) references public.contacts(tenant_id,id) on delete cascade,
  foreign key(tenant_id,unit_id) references public.units(tenant_id,id)
);

-- Thread = histórico persistente do canal; não equivale ao atendimento/ticket.
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  channel_id uuid not null,
  contact_id uuid not null,
  last_activity_at timestamptz not null default now(),
  unique(tenant_id,id),
  unique(tenant_id,channel_id,contact_id),
  foreign key(tenant_id,channel_id) references public.channels(tenant_id,id),
  foreign key(tenant_id,contact_id) references public.contacts(tenant_id,id)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  thread_id uuid not null,
  department_id uuid null,
  unit_id uuid null,
  queue_id uuid null,
  assignee_user_id uuid null,
  status text not null default 'waiting_bot' check(status in ('waiting_bot','waiting_queue','assigned','waiting_customer','pending','resolved','closed')),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  bot_paused boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,id),
  foreign key(tenant_id,thread_id) references public.threads(tenant_id,id),
  foreign key(tenant_id,department_id) references public.departments(tenant_id,id),
  foreign key(tenant_id,unit_id) references public.units(tenant_id,id),
  foreign key(tenant_id,queue_id) references public.queues(tenant_id,id),
  foreign key(tenant_id,assignee_user_id) references public.tenant_memberships(tenant_id,user_id)
);
create index if not exists tickets_inbox_idx on public.tickets(tenant_id,status,updated_at desc);
create index if not exists tickets_queue_idx on public.tickets(tenant_id,queue_id,status,updated_at desc);

create table if not exists public.ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  ticket_id uuid not null,
  requested_by uuid not null,
  target_unit_id uuid null,
  target_department_id uuid null,
  target_queue_id uuid null,
  status text not null default 'pending' check(status in ('pending','accepted','rejected','expired','cancelled')),
  note text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz null,
  foreign key(tenant_id,ticket_id) references public.tickets(tenant_id,id),
  foreign key(tenant_id,requested_by) references public.tenant_memberships(tenant_id,user_id),
  foreign key(tenant_id,target_unit_id) references public.units(tenant_id,id),
  foreign key(tenant_id,target_department_id) references public.departments(tenant_id,id),
  foreign key(tenant_id,target_queue_id) references public.queues(tenant_id,id)
);
create unique index if not exists ticket_one_pending_transfer_idx on public.ticket_transfers(tenant_id,ticket_id) where status='pending';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  thread_id uuid not null,
  ticket_id uuid null,
  provider_message_id text,
  sender_type text not null check(sender_type in ('contact','agent','bot','system')),
  content_type text not null default 'text',
  body text,
  is_internal boolean not null default false,
  sent_at timestamptz not null default now(),
  unique(tenant_id,id),
  foreign key(tenant_id,thread_id) references public.threads(tenant_id,id),
  foreign key(tenant_id,ticket_id) references public.tickets(tenant_id,id)
);
create unique index if not exists messages_provider_unique on public.messages(tenant_id,provider_message_id) where provider_message_id is not null;
create index if not exists messages_thread_time_idx on public.messages(tenant_id,thread_id,sent_at desc);

create table if not exists public.provider_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  provider text not null,
  event_key text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  unique(tenant_id,provider,event_key)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  actor_id uuid null,
  event_type text not null,
  subject_type text not null,
  subject_id uuid null,
  metadata jsonb not null default '{}'::jsonb, -- jamais incluir CPF, tokens ou conteúdo secreto
  created_at timestamptz not null default now()
);
create index if not exists audit_events_by_time on public.audit_events(tenant_id,created_at desc);

-- Segurança: funções SECURITY DEFINER exigem revisão específica de dono/GRANT/search_path.
-- is_member usa auth.uid() do JWT autenticado; nunca aceita user_id arbitrário.
create or replace function public.is_tenant_member(p_tenant uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.tenant_memberships m
    where m.tenant_id = p_tenant
      and m.user_id = (select auth.uid())
      and m.active
  )
$$;

create or replace function public.can_access_scope(
  p_tenant uuid, p_unit uuid, p_department uuid, p_queue uuid, p_capability text
)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.tenant_memberships m
    where m.tenant_id = p_tenant
      and m.user_id = (select auth.uid()) and m.active
      and (
        (m.role = 'tenant_admin')
        or exists(
          select 1 from public.member_grants g
          where g.tenant_id = m.tenant_id and g.user_id = m.user_id
            and p_capability = any(g.capabilities)
            and (g.unit_id is null or g.unit_id = p_unit)
            and (g.department_id is null or g.department_id = p_department)
            and (g.queue_id is null or g.queue_id = p_queue)
        )
      )
  )
$$;

-- Mínimo de exposição das funções; concessão explícita só para authenticated.
revoke all on function public.is_tenant_member(uuid) from public, anon;
revoke all on function public.can_access_scope(uuid,uuid,uuid,uuid,text) from public, anon;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.can_access_scope(uuid,uuid,uuid,uuid,text) to authenticated;

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.units enable row level security;
alter table public.departments enable row level security;
alter table public.queues enable row level security;
alter table public.member_grants enable row level security;
alter table public.channels enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_external_links enable row level security;
alter table public.threads enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_transfers enable row level security;
alter table public.messages enable row level security;
alter table public.provider_events enable row level security;
alter table public.audit_events enable row level security;

-- POLÍTICAS DE LEITURA DE EXEMPLO: escritas devem ser orquestradas por endpoints
-- transacionais com autorização; não conceder mutação genérica por browser.
create policy tenants_member_select on public.tenants for select to authenticated
  using (public.is_tenant_member(id));
create policy own_membership_select on public.tenant_memberships for select to authenticated
  using (user_id = (select auth.uid()));
create policy units_read on public.units for select to authenticated
  using(public.is_tenant_member(tenant_id) and public.can_access_scope(tenant_id,id,null,null,'inbox.read'));
create policy departments_read on public.departments for select to authenticated
  using(public.is_tenant_member(tenant_id) and public.can_access_scope(tenant_id,null,id,null,'inbox.read'));
create policy queues_read on public.queues for select to authenticated
  using(public.can_access_scope(tenant_id,unit_id,department_id,id,'inbox.read'));
create policy channels_read on public.channels for select to authenticated
  using(public.is_tenant_member(tenant_id)); -- refinar escopo de canais na fase Auth
create policy tickets_read on public.tickets for select to authenticated
  using(public.can_access_scope(tenant_id,unit_id,department_id,queue_id,'inbox.read'));
create policy transfer_read on public.ticket_transfers for select to authenticated
  using(exists(select 1 from public.tickets t where t.id=ticket_id and t.tenant_id=ticket_transfers.tenant_id
    and public.can_access_scope(t.tenant_id,t.unit_id,t.department_id,t.queue_id,'inbox.read')));
create policy messages_read on public.messages for select to authenticated
  using(exists(select 1 from public.tickets t where t.thread_id=messages.thread_id and t.tenant_id=messages.tenant_id
    and public.can_access_scope(t.tenant_id,t.unit_id,t.department_id,t.queue_id,'inbox.read')));
-- ATENÇÃO: POLICY acima permite acesso a histórico de thread por escopo de pelo menos um ticket.
-- Antes de produção implementar controle de visibilidade por ticket/mensagem e proteção
-- de dados sensíveis de outros setores. Exemplo educativo, NÃO PASSOU auditoria.

-- Expor contatos, links externos, mensagens internas e auditoria somente via APIs
-- com autorização granular até políticas específicas serem aprovadas.

-- Testes de aceitação ainda obrigatórios (não incluídos nesta migração):
-- 1) RLS cruzado e por fila/unidade; 2) owner claim/transfers transacionais;
-- 3) concessões por escopo em tabelas de contatos/threads; 4) canal/identidade;
-- 5) delete/update policies, uploads e retenção; 6) client a poder apenas ler seu escopo.
