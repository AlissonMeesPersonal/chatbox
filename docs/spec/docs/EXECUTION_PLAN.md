# Backlog de execução para implementação incremental

## Etapa 0 — Fundamentos de produto

- [ ] Criar repositório Git e CI (lint, TS strict, teste, build); sem segredos.
- [ ] Next.js App Router, React, Tailwind ou CSS modules e design tokens.
- [ ] Tema claro/escuro, layout desktop e mobile, componentes, acessibilidade.
- [ ] Story/demo com dados falsos e UI premium; nunca mostrar envio real onde não existe.
- **Aceite:** login demo, shell e inbox fake responsiva, nenhuma duplicação visual e navegação sem erros.

## Etapa 1 — Isolamento e autenticação

- [ ] Supabase Auth, convite e sessão, MFA admin, troca empresa.
- [ ] tenants, units, departments, queues, memberships, grants, channels.
- [ ] RLS e testes cruzados, funções com service role guardado.
- [ ] Cadastro de cargos por escopo, UI e API de grants.
- **Aceite:** acesso por escopo resistente a URL/requests manuais.

## Etapa 2 — Inbox transacional

- [ ] Contatos, threads, tickets, mensagens, notas, etiquetas.
- [ ] Banco + testes de claim CAS, transferência pendente/aceita, concorrência.
- [ ] Filtros, tarefas e atalhos de movimentação rápida.
- [ ] Realtime de alterações com fallback de sincronização.
- **Aceite:** duas sessões disputam caso, uma assume; uma transferência mantém histórico e preserva permissions.

## Etapa 3 — Vi e Webchat

- [ ] Versionar fluxos, publicar/despublicar e simular.
- [ ] Menus, busca silenciosa por telefone, confirmação unidade, verify externo, fallback.
- [ ] Entrega ao humano desativa Vi no caso, notas e tags.
- [ ] Widget Webchat self-hosted com origem permitida por tenant.
- **Aceite:** 0/1/N registros, roteamento setor/unidade e painel por escopo.

## Etapa 4 — WhatsApp oficial

- [ ] Resolver fluxo de contas WABA/Embedded Signup, verificações da Meta.
- [ ] Webhook verificado, dedupe, storage de mídia e status.
- [ ] Template manager e estado da janela de atendimento.
- [ ] Flows com endpoint protegido; versão fallback em botões/texto.
- **Aceite:** teste com número autorizado, custos dinâmicos e estados reais sem promessas de envio grátis.

## Etapa 5 — CRM e operações

- [ ] Lead capture, dedupe, funis e tarefas.
- [ ] Filtros/etiquetas automáticas, SLA e dashboards.
- [ ] Promessas de pagamento, sem quitação baseada em resposta.
- **Aceite:** histórico auditável e segmento independente (não academia).

## Etapa 6 — Campanhas e custos

- [ ] Cadastro público consentido, audiência, template sync.
- [ ] Custo estimado e ledger real, limites por tenant.
- [ ] Scheduler, worker, idempotência, pausas, DLQ.
- [ ] Métricas por canal, unidade, setor, agente.
- **Aceite:** campanha se mantém dentro de orçamento sob falhas, respeita opt-out e não duplica envios.

## Etapa 7 — Conectores

- [ ] Interface genérica e integração EVO opcional para cliente habilitado.
- [ ] Mapeamento de telefone/unidade/cadastro, dados mínimos, credenciais seguras.
- [ ] Logs, retriable requests, circuit breaker e fallback humano.
- **Aceite:** tenant sem EVO funciona normalmente e tenant com EVO não vaza dados de outro.

## Etapa 8 — SaaS comercial

- [ ] Planos, billing, quotas e suporte sem acesso padrão às mensagens.
- [ ] Audit log, análise de segurança, restore testado e conformidade.
- [ ] CI/CD preview/staging/prod, smoke test e documentação de incidentes.
- **Aceite:** piloto com uma empresa antes de self-service de vendas.

## Proteções de processo

Não fazer deploy automaticamente no repositório original do usuário sem identificar repo e autorização contextual. Rodadas pequenas com PR, checklist, logs de teste, instruções de rollback e confirmação dos dados de produção antes de migrar. Não inventar tokens Meta, EVO, URL de callback nem credenciais. Não deixar mock em produção apresentado como dado real.
