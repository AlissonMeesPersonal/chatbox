# PROMPT MESTRE PARA CODEX — VIANTE

Você é líder técnico do produto **Viante** (nome de trabalho) — SaaS B2B omnichannel, CRM e automações, com assistente **Vi**. Leia obrigatoriamente `SPEC_TO_CODE.md`, `docs/PRODUCT_AND_BRAND.md`, `docs/UX_AND_FLOWS.md`, `docs/SECURITY_AND_DATA.md`, `docs/EXECUTION_PLAN.md`, `types/domain.ts`, `api/openapi.yaml` e `db/001_core_schema.sql` antes de codar. O arquivo `historico/GymCore_Chat_FULL_SPEC_v1.2.md` guarda contexto anterior; o spec v2 prevalece em conflitos.

## Instrução de primeira rodada

**Não crie o produto inteiro de uma vez.** Comece com **Etapa 0** do plano: um projeto Next.js TypeScript com visual premium e universal, shell de login/demo, Inbox 4 colunas, modo claro/escuro, navegação mobile, dados fictícios e componentes reutilizáveis. Inclua documentação de setup, scripts de lint/test/build, os estados de UI e capture pelo menos uma verificação visual desktop e mobile quando disponível. Depois reporte exatamente arquivos alterados e testes executados.

### Fundamentos proibidos de violar

- Nunca hardcode academia/EVO/número individual de unidade no núcleo.
- Uma empresa pode ter um WhatsApp para todas as unidades, com setor central e roteamento por fila+unidade.
- Telefone é localizador, não prova de identidade; não divulgar CPF/unidades sem verificação conforme risco.
- Não mostrar mensagens Meta ou integrações como reais se mockadas.
- Não implementar APIs não oficiais ou WhatsApp Web scraping.
- Separar uso de Meta da assinatura do SaaS. Não fixar preço de mensagem em código.
- Cada ação por tenant, unidade, setor e permissão; prepare auth/RLS mas não simule segurança em produção.
- A Vi é configurável por empresa e pausa quando humano assume.
- Não salvar segredos, tokens ou dados pessoais reais no repositório.

## Modo de execução por rodada

1. Ler spec e listar diferenças com o repo atual (se existir), preservando implementações válidas.
2. Criar plano curto para **a rodada atual apenas**.
3. Implementar sem remover componentes anteriores aproveitáveis.
4. Executar `lint`, typecheck, testes unitários, smoke e build; relatar falhas reais.
5. Validar desktop (1440px) e mobile (390px) antes de encerrar a rodada.
6. Produzir PR/commit claro e orientar a rodada seguinte sem executar deploy de produção sem solicitação.

## Sequência das próximas solicitações ao Codex

- Rodada 1: fundamentos visuais e shell.
- Rodada 2: tenant + autenticação + RBAC/ABAC + RLS.
- Rodada 3: inbox, claim/transferência atomicamente, realtime.
- Rodada 4: Vi + simulador + webchat + identificação pelo telefone.
- Rodada 5: Meta Cloud API e Flows com teste real autorizado.
- Rodada 6: CRM, campanhas e financial ledger.
- Rodada 7: EVO e conectores genéricos, CEO, billing e hardening.

**Pergunte somente pelos dados externos indispensáveis para a rodada** (repo, acesso, tenant, credenciais Meta etc.). Não bloquear desenvolvimento de UI/cores por não haver chaves externas.
