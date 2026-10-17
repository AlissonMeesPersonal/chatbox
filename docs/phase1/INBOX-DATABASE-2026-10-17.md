# Viante — Atendimento persistente: execução em 17/10/2026

Projeto Supabase: `idmqygvbtofkmbccazyp` (conta `alisson saas`).
Migração aplicada: `viante_internal_inbox_foundation`.

## Estruturas criadas e verificadas
- `public.viante_contacts` (organization_id, display_name)
- `public.viante_tickets` (organization_id, unit_id, contact_id, assignee_id, status)
- `public.viante_messages` (organization_id, ticket_id, author_id, body, kind)

Todas as tabelas apresentam RLS ativado, e os advisors de segurança retornaram zero alertas na consulta. FKs compostas impedem vincular ticket a contato ou unidade de outro tenant. Mensagens têm somente escopo de ticket, sem envio externo; os tipos disponíveis são `internal` e `note`.

## Garantias atuais
- Apenas membros ativos do tenant, respeitando vínculo de unidade ou role owner/admin, podem ler tickets.
- Contatos são visíveis apenas por tickets que o usuário consegue ler.
- Mensagens são visíveis apenas por tickets acessíveis.
- Inserção de mensagens exige autor igual a `auth.uid()` e ticket legível.
- Nenhum cliente anônimo lê ou escreve essas tabelas; criação e gestão de tickets ainda precisam de endpoints privilegiados, validados e auditados.

## Pendências antes de um teste operacional de login
1. Adicionar dependências Supabase JS + SSR **com lockfile atualizado e versões fixas**.
2. Implementar login/logout/recuperação e callbacks server-side, cookies, proteção de rotas, e checagem de sessão/tenant.
3. Provisionar primeiro owner e organização por rotina administrativa segura, sem expor `service_role`.
4. Adaptar a UI demo à API persistida; manter os dados fictícios em tela separada.
5. Criar testes de isolamento cross-tenant/cross-unit e concorrência, e executar testes E2E.
6. Configurar variáveis públicas (URL, publishable key) na Vercel e secrets exclusivamente em backend seguro.
7. Separar a branch de produção de previews; não liberar UI fictícia como sistema funcional.

**Importante:** banco preparado não equivale a login funcional ou canal WhatsApp conectado. Nenhum usuário, empresa, ticket ou mensagem real foi provisionado.
