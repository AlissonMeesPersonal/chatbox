# Viante — Execução da Fase 1 (17/10/2026)

Projeto exclusivo: `idmqygvbtofkmbccazyp` (conexão `alisson saas`).

## Banco confirmado
Migração Supabase **`20261017232737_viante_phase1_tenant_foundation`** aplicada com sucesso.

Tabelas criadas:
- `public.viante_organizations` — nome, slug, timestamps.
- `public.viante_memberships` — vínculo de usuário Auth com organização, papel e status.
- `public.viante_units` — unidades da organização.
- `public.viante_unit_memberships` — usuário por unidade com chaves estrangeiras compostas.

Todas estão com **RLS habilitado**. Somente `authenticated` recebe SELECT filtrado e sem permissão direta de escrita. As policies de organização e unidade consultam memberships ativas, e o cadastro de memberships é lido pelo próprio usuário. A leitura de unidade exige papel owner/admin ativo ou vínculo ativo àquela unidade.

## Verificações efetivamente realizadas
- `list_tables(public)`: quatro tabelas, todas com `rls_enabled=true`, todas vazias.
- `list_migrations`: confirmou versão `20261017232737`.
- `get_advisors(security)`: zero lints encontrados na verificação inicial.

## Limites e próxima implementação
Esta etapa **não** implementou Auth SSR, provisionamento de organização/owner, conversa persistida, APIs, login funcional ou testes de isolamento entre duas organizações. Não oferecer esta UI demonstrativa como um chat real. Criar migrations adicionais versionadas e testes cruzados antes de ativar escrita e dados pessoais. Verificar especificação em `docs/spec` antes de ampliar o domínio.

A conexão Supabase autorizada é **alisson saas**. Nunca aplicar essas migrações nos bancos Barber, 26Fit ou Atletic.
