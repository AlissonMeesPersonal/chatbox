# Viante — ativação Supabase (Fase 1)

## Projeto alvo
- GitHub: `AlissonMeesPersonal/chatbox`
- Branch de desenvolvimento: `feat/phase-0-visual`
- Supabase project ref: `idmqygvbtofkmbccazyp`
- URL pública: `https://idmqygvbtofkmbccazyp.supabase.co`

## Bloqueio em 17/10/2026
O conector Supabase disponibiliza outros três projetos, mas `get_project(idmqygvbtofkmbccazyp)` retorna **You do not have permission to perform this action**. Nenhuma migração deve ser aplicada em projetos substitutos.

Para liberar, reconectar o app Supabase nas configurações de Plugins do ChatGPT com a conta/organização que administra o projeto Viante, autorizando acesso ao projeto específico. Não enviar senhas, service role ou access tokens em chat.

## Gate de implementação
1. Confirmar `get_project` e inspecionar tabelas, migrations, configurações de Auth e advisors do alvo.
2. Reconciliar o rascunho `tenant-schema-review.sql` com o Spec-to-Code v2.0 em `docs/spec`: memberships/grants, unidades, setores, transferências e visibilidade de mensagens.
3. Validar RLS com dois tenants e usuários de unidades diferentes; proibir acesso cruzado, inclusive em relacionamentos e buscas.
4. Versionar migração revisada; aplicar somente ao projeto alvo; testar rollback e grants.
5. Integrar Auth SSR no Next.js, sessão/cookies, recuperação e MFA para perfis privilegiados. Manter service role exclusivamente no backend.
6. Implementar onboarding/provisionamento auditado e idempotente; não permitir criação arbitrária de owners pelo navegador.
7. Executar lint, typecheck, testes, build, revisar segurança e só então liberar features além da demo.

## Publicação
A Vercel está vinculada ao GitHub. Separar explicitamente production branch (`main`) dos previews de `feat/*` antes de homologar a autenticação. O primeiro deploy automático foi interpretado como production; não presumir isolamento sem revisar configuração da Vercel.

## Situação
A implementação do banco e autenticação REAL permanece bloqueada por autorização do Supabase correto. O arquivo SQL anterior é proposta de revisão, não migração aplicada.
