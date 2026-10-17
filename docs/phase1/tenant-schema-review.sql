-- VIANTE / Fase 1 - proposta inicial. NAO executar automaticamente.
-- Aplicar somente apos reconciliar docs/spec, com acesso confirmado ao projeto correto.
-- Modelo intencionalmente sem INSERT/UPDATE/DELETE para clientes. Provisionamento via backend auditado.

create table if not exists public.viante_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.viante_memberships (
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','agent','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.viante_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.viante_organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table if not exists public.viante_unit_memberships (
  organization_id uuid not null,
  unit_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (unit_id,user_id),
  foreign key (unit_id,organization_id) references public.viante_units(id,organization_id) on delete cascade,
  foreign key (organization_id,user_id) references public.viante_memberships(organization_id,user_id) on delete cascade
);

create index if not exists viante_memberships_user_idx on public.viante_memberships(user_id, status);
create index if not exists viante_units_org_idx on public.viante_units(organization_id);
create index if not exists viante_unit_memberships_user_idx on public.viante_unit_memberships(user_id,organization_id);

alter table public.viante_organizations enable row level security;
alter table public.viante_memberships enable row level security;
alter table public.viante_units enable row level security;
alter table public.viante_unit_memberships enable row level security;

-- A membership policy only reads its own row: no recursive RLS.
create policy viante_memberships_self_read on public.viante_memberships
for select to authenticated using (user_id = (select auth.uid()));

create policy viante_organizations_member_read on public.viante_organizations
for select to authenticated using (
  exists(select 1 from public.viante_memberships m
    where m.organization_id = id and m.user_id = (select auth.uid()) and m.status = 'active')
);

create policy viante_units_member_read on public.viante_units
for select to authenticated using (
  exists(select 1 from public.viante_memberships m
    where m.organization_id = viante_units.organization_id and m.user_id = (select auth.uid()) and m.status = 'active')
);

create policy viante_unit_memberships_self_read on public.viante_unit_memberships
for select to authenticated using (user_id = (select auth.uid()));

-- Only signed-in users may read rows allowed by RLS. No client-side writes.
revoke all on public.viante_organizations, public.viante_memberships,
  public.viante_units, public.viante_unit_memberships from anon, authenticated;
grant select on public.viante_organizations, public.viante_memberships,
  public.viante_units, public.viante_unit_memberships to authenticated;
