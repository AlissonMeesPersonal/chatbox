# VIANTE — SPEC-TO-CODE v2.0

**Categoria:** SaaS B2B de atendimento omnichannel, CRM e automação, independente de segmento.  
**Identidade de trabalho:** **Viante** (nome provisório, não validado no INPI nem como domínio).  
**Assistente configurável:** **Vi** (apelido padrão; cada empresa pode alterar nome e personalidade).  
**Estado:** especificação técnica **proposta**, sem backend, deploy, integrações ou homologação executados.  
**Data:** 17 de outubro de 2026.  
**Legado preservado:** `historico/GymCore_Chat_FULL_SPEC_v1.2.md`. O novo spec prevalece em qualquer conflito relacionado a nome universal, roteamento por número de rede e identificação pelo telefone.

## 0. Visão e princípios inegociáveis

**Promessa do produto:** um único lugar para receber, identificar, qualificar, distribuir, responder e acompanhar mensagens em várias equipes e unidades, inclusive com **um número de WhatsApp por rede inteira**, sem obrigar cada unidade a contratar seu próprio número.

**Primeiro canal real:** WhatsApp Business Platform / Cloud API oficial. **Segundo canal:** Webchat próprio, sem tarifa por mensagens da Meta (infraestrutura não é gratuita). Futuramente e-mail, Instagram/Messenger e outros canais via adaptadores oficiais; nenhuma integração deve ser anunciada como pronta até ser homologada.

O núcleo **não pode ter dependência obrigatória de EVO, matrícula, aluno, CPF ou academia**. O fluxo genérico usa `contato`, `empresa`, `unidade`, `setor`, `canal`, `fila`, `ticket/caso` e `atendente`. Conectores de CRM/ERP (EVO para clientes do segmento fitness) são opcionais e isolados.

**Cinco compromissos de projeto:** (1) UI premium, rápida e responsiva; (2) isolamento multiempresa forte; (3) movimentação de conversas com mínima fricção; (4) custo operacional verificável antes e após campanha; (5) código modular, sem microserviços prematuros ou dependência de extensões de navegador.

## 1. Modelo conceitual correto

```text
Viante (operadora do SaaS)
└── Empresa contratante (tenant)
    ├── Plano, assinatura, limites, tema, equipe e integrações
    ├── 1..N canais autorizados (ex.: 1 WhatsApp da rede inteira)
    ├── Setores corporativos: Comercial, Suporte, Cancelamento, Financeiro ...
    ├── 0..N unidades: Matriz, Loja A, Loja B, Filial 03 ...
    ├── Filas de atendimento: setor + unidade OPCIONAL
    ├── Usuários e cargos: papéis com concessões por empresa/unidade/setor/fila
    ├── Vi: menu inicial, identificação, roteamento, tags e transbordo humano
    └── Caixa de entrada, CRM, funis, campanhas, cobrança, auditoria e relatórios
```

- **Setor** é uma função de atendimento corporativa, independentemente das unidades.
- **Unidade** é o destino/escopo geográfico ou operacional; cliente pode escolher unidade mesmo com 1 número para toda a rede.
- **Fila** pode ser `Comercial`, `Comercial / Filial A`, `Suporte / Filial B`; deve permitir uma fila central sem unidade.
- **Usuário** tem uma identidade global e um ou mais vínculos/escopos; pode atuar em diversas filas/unidades sem contas duplicadas.
- **Conversa de canal (thread)** guarda histórico contínuo; **caso de atendimento (ticket)** representa uma solicitação e pode ser aberto/reaberto várias vezes no mesmo canal. Não criar uma nova conversa WhatsApp desnecessariamente a cada transferência.
- **Contato** é deduplicado no tenant por identificadores confiáveis e pode ter vínculos com várias unidades e sistemas externos; não confundir número com verificação de identidade.

## 2. Personas, cargos e permissões

| Papel padrão | Visão | Operações | Restrições |
|---|---|---|---|
| CEO SaaS | Empresas, uso agregado, planos e saúde de integração | Assinaturas, bloqueio, suporte e auditoria de plataforma | Sem acesso rotineiro a mensagens privadas dos clientes |
| Admin empresa | Toda sua empresa e as unidades | Setores, unidades, canais, usuários, regras, custos, templates | Nunca dados de outra empresa |
| Gestor rede | Unidades/setores outorgados | Filas, relatórios e redistribuição, configurações delegadas | Sem billing SaaS ou configuração global sem concessão |
| Gestor unidade | Unidades autorizadas | Equipes locais, filas locais e dashboards locais | Outras unidades ocultas e inacessíveis |
| Supervisor | Filas autorizadas | Assumir/transferir, distribuir, acompanhar SLA | Não concede permissões ou vê canais externos |
| Atendente | Casos próprios, filas e contatos autorizados | Responder, notas, etiquetas permitidas, transferência autorizada | Sem campanhas em massa, exportações nem relatórios globais por padrão |
| Financeiro | Carteira e casos financeiros autorizados | Negociação, promessa de pagamento | Confirmar quitação só com integração confiável ou privilégio específico + evidência |
| Auditor | Eventos e métricas autorizados | Consultar trilha | Sem enviar mensagens ou editar casos |

**Política:** RBAC (papel) + ABAC (tenant, unidade, setor, fila, caso, status, permissões). O servidor sempre revalida as duas camadas; esconder menu não substitui autorização. O mesmo usuário pode ter papéis distintos por escopo. Suporte da plataforma acessa conteúdo apenas por fluxo excepcional e auditado, nunca por padrão.

**Menu progressivo:** `Inbox` é a tela prioritária para atendentes; gestor vê `Inbox, Contatos, Leads, Filas, Relatórios, Equipe`; admin inclui `Automações, Campanhas, Templates, Integrações, Configurações`; CEO vê shell independente.

## 3. Jornada da Vi — número único e identificação inteligente

**Fluxo recomendado (não enviar mensagens desnecessárias):**

```text
Cliente envia Olá → webhook oficial recebe número (E.164)
    → localizador consulta contatos do Viante
    → opcionalmente consulta CRM/ERP autorizado pela empresa (ex.: EVO)
    → coleta resultado em SILÊNCIO, sem divulgar dados pessoais
    → Vi envia menu de triagem ou Flow interativo permitido
        1. Produtos/planos
        2. Cancelamento
        3. Falar com uma unidade
        4. Outros assuntos / humano (configurável)
    → seleciona intenção/setor
    → resolve unidade por contexto, histórico ou escolha do cliente
       • zero cadastros: oferece escolha livre e atendimento humano
       • uma unidade confiável: sugere unidade e pede confirmação
       • várias unidades: exige verificação apropriada ANTES de revelar vínculos privados;
         depois lista apenas as unidades autorizadas/relacionadas
       • sistema indisponível: fallback sem travar triagem
    → etiqueta o caso (intenção, setor, unidade, origem, prioridade)
    → entrega à fila e coloca Vi em pausa; atendente assume atomicamente
```

**Telefone ≠ identidade confirmada.** A busca por telefone serve como *sinal de localização*, não concede acesso a contrato, débito, cancelamento ou unidades sensíveis sem verificação adicional baseada em risco. **Não solicitar CPF por padrão.** Quando necessário, coletar dado mínimo em formulário protegido, sem registrar CPF em logs e sem exibir integralmente; aplicar retenção mínima e LGPD. A informação de que há várias unidades também pode ser sensível; não revelá-la sem confirmação adequada.

**WhatsApp Flows:** usar formulário nativo quando adequado; aceitar botões de resposta e listas simples. Nem botão nem tela do Flow constituem mensagem de WhatsApp separada, mas a mensagem de lançamento e quaisquer mensagens posteriores seguem as regras tarifárias vigentes. Validar limites de componentes, experiências suportadas, políticas e segurança de `data_exchange` na integração real. **Webchat** reaproveita o mesmo motor de triagem.

**Editor visual:** gatilho → condição → ação, com nós `start`, `message`, `menu`, `flow`, `lookup_contact`, `verify_identity`, `select_unit`, `tag`, `route`, `wait`, `human_handoff`, `fallback`, `end`. Rascunho, simulação, validação, publicação versionada, rollback e logs por execução. Lidar com respostas inválidas, timeout, back, opt-out e escolha de humano.

## 4. Inbox premium: movimentação sem esforço

**Desktop:** sidebar compacta (64–240px), coluna conversas (300–370px), painel central (flex), perfil contextual (320px recolhível). **Mobile:** lista → conversa → detalhes em rotas/drawers, composer fixo acima do teclado e touch targets ≥ 44px. Modo escuro padrão de trabalho opcional, modo claro consistente, fontes Inter/Manrope, tokens e contraste WCAG AA.

Ações visíveis por permissão: `Assumir`, `Responder`, `Transferir`, `Devolver à fila`, `Aguardar cliente`, `Pausar`, `Agendar retorno`, `Concluir`, `Reabrir`, `Etiqueta`, `Nota interna`. Barra de ações responsiva: os quatro comandos mais comuns disponíveis em até dois gestos.

**Transferir** abre modal com `Unidade` opcional → `Setor` → `Fila` → `Atendente` opcional; autocomplete, destinos recentes, preview e nota interna. Transf. pendente preserva responsável anterior até aceitação, ou usa política explícita da empresa. Histórico de mensagens, SLA e etiquetas mantidos; audit trail para quem, quando, origem, destino, motivo. Nunca transferir entre tenants.

**Concorrência:** `assume(ticket_id, expected_version)` resolve atomicamente com compare-and-swap / transação; apenas um dono ativo por caso. `409 CONFLICT` se versão mudou; UI atualiza antes de permitir novo envio. Bot não envia depois de handoff humano. Webhooks duplicados não duplicam mensagens.

**Filas e estados:** `waiting_bot`, `waiting_queue`, `assigned`, `waiting_customer`, `pending`, `resolved`, `closed`; transferência com `pending`, `accepted`, `rejected`, `expired`, `cancelled`. SLA modelado em relógios distintos: primeira resposta, tempo de resolução e tempo na fila.

## 5. Módulos e rotas do produto

| Módulo | Rota ilustrativa | Entrega da V1 |
|---|---|---|
| Autenticação / empresas | `/login`, `/select-workspace` | Convite seguro, troca tenant, MFA para admins |
| Onboarding | `/onboarding` | Criar empresa, unidade opcional, setor, equipe, canal demo |
| Inbox | `/app/inbox`, `/app/inbox/[ticketId]` | Conversas reais após conectar canal, filtros e ações |
| Contatos | `/app/contacts` | Identidades, vínculo com unidades, timeline |
| CRM & Leads | `/app/leads`, `/app/pipelines` | Captura, dedupe, etapas Kanban, tarefas |
| Filas e setores | `/app/settings/queues` | CRUD, escalas, horários, roteamento |
| Vi Automações | `/app/automation`, `/app/automation/[id]` | Construtor, simulação, publish e logs |
| Campanhas | `/app/campaigns` | Segmentação, aprovação, agendamento, pausar, relatório |
| Templates Meta | `/app/templates` | Sincronização de estados da Meta, preview, variáveis |
| Cobranças / pagamentos | `/app/collections` | Importação, negociação e promessas; quitação verificada |
| Financeiro de mensagens | `/app/usage` | Estimado vs efetivo, orçamento, alertas |
| Integrações | `/app/integrations` | WhatsApp oficial, webchat, EVO opcional |
| Equipe e permissões | `/app/team` | Convites, cargos, grants por escopo e auditoria |
| Relatórios | `/app/reports` | SLA, produtividade, conversão, campanhas e custos |
| Configurações | `/app/settings` | Empresa, branding, horários, segurança, planos |
| Plataforma CEO | `/platform/*` | Empresas, planos, limites, incidências sem conteúdo privado |

Além da V1: e-mail, Instagram/Facebook, base de conhecimento, IA generativa, marketplace de conectores, cobrança do cliente final por integrações adicionais. Usar feature flags; não mostrar botão funcional sem backend real.

## 6. Segmentos atendidos (sem hardcode)

**Exemplos de presets de onboarding** (somente dados e textos configuráveis):
- Rede de academias: Comercial, Suporte, Cancelamento; conector EVO opcional.
- Clínica: Agendamento, Recepção, Financeiro; fluxos sensíveis sujeitos a revisão de privacidade e políticas.
- Loja e e-commerce: Vendas, Entrega, Trocas; adaptador ERP futuro.
- Escola: Matrículas, Financeiro, Secretaria.
- Serviços locais: Orçamentos, Agenda, Suporte técnico.

O produto usa terminologia universal em todos os menus. Ao trocar preset, não muda banco, rotas nem componentes — somente templates iniciais do tenant.

## 7. Arquitetura técnica recomendada (baixo custo inicial)

**App:** Next.js App Router + TypeScript strict, HTML semântico, CSS variables/tokens + Tailwind ou CSS modules + componentes acessíveis, SSR só onde necessário; WebSockets / realtime apenas no Inbox. **Backend:** API routes + camada de domínio e repositório; validar payload com Zod; SDK Meta oficial via HTTP autenticado servidor; nenhuma chave privada no cliente.

**Infra:** Vercel (frontend/API curta), Supabase Postgres/Auth/Storage/RLS, trabalhador durável separado para agendamentos/campanhas/webhooks (provider selecionado por orçamento) e fila persistente no banco/serviço de filas. **Nunca usar funções serverless efêmeras como única fila confiável.** Projeto Supabase compartilhado por múltiplos tenants com `tenant_id` e RLS desde o primeiro dia; possibilidade futura de migração de tenants Enterprise para banco isolado.

**Decisão de custo:** monólito modular antes de microserviços; 1 tenant = empresa, não 1 projeto Supabase por cliente. Índices e paginação, mídia com retenção/quotas, agregações de relatórios por lote, IA opcional em vez de obrigatória. Meta custa à parte; cobrança por uso é apenas pass-through com transparência, sem afirmar tarifa fixa.

**Domínios:** `tenancy`, `identity`, `authorization`, `channels`, `contacts`, `inbox`, `routing`, `bot`, `crm`, `campaigns`, `templates`, `billing`, `collections`, `integrations`, `reporting`, `audit`.

**Organização de código (monorepo):**

```text
apps/web/src/app/(auth), (platform), (workspace)
apps/web/src/components/ui, inbox, bot, campaigns, admin
apps/web/src/modules/<dominio>/{domain,application,infrastructure,ui}
apps/web/src/app/api/v1/**
packages/contracts (Zod schemas + TypeScript types)
packages/design-tokens (theme, typography, spacing)
packages/integrations (interfaces + whatsapp + webchat + evo)
packages/database (SQL migrations, RLS, fixtures)
workers/dispatch (queues, retries, reconciliation)
tests/unit, integration, e2e, security
```

**Autenticação e segurança:** sessão Supabase Auth, MFA para contas privilegiadas, revogação de sessões; CSRF e cookies seguros; autorização no servidor e RLS, limites por recurso, assinatura/validação dos webhooks e rate limit. Criptografar segredos no armazenamento com KMS/serviço adequado, separar service role das credenciais web. Auditoria imutável de decisões de acesso, transferências, templates, envios, exportação e financeiro.

## 8. Contratos de domínio e invariantes

- `tenant_id` derivado de sessão e membership ativos no servidor; cliente não escolhe outro tenant arbitrariamente por enviar um ID.
- Canal/número pertence a um tenant; pode servir várias unidades; roteamento escolhe unidade a cada caso.
- `phone_e164` identifica um contato provável; associação com registros externos depende de confiança, normalização e verificação.
- Ticket só tem um `assignee_user_id` ativo, ou fila sem dono.
- Histórico da thread preservado ao transferir unidade/setor; não substituir autor/horário original.
- Reabertura é auditável; ticket resolvido só reabre segundo regra.
- Todos os envios em massa passam por consentimento, opt-out e classificação/template permitidos; tentativa `idempotency_key` única.
- Pagamento confirmado exige prova de uma fonte confiável autorizada, nunca apenas texto/print do cliente.
- Integração indisponível não deve impedir o fluxo de triagem humana.

## 9. Integração WhatsApp oficial

**Onboarding:** autorização Meta, Embedded Signup quando elegível, WABA, número, status, permissões e webhooks. Suportar 1 número para N unidades e N números por tenant conforme plano. Guardar apenas credenciais necessárias com rotação e monitoramento.

**Pipeline inbound:** verificar assinatura → persistir evento com chave dedupe → resolver canal/tenant → normalizar conteúdo e mídia → criar/atualizar contato/thread → chamar motor Vi se bot ativo → enfileirar ações de resposta permitidas → notificar UI realtime.

**Pipeline outbound:** autorização do agente ou campanha → verificar janela/template, opt-in e categoria → enfileirar com idempotência → reservar orçamento → worker com backoff/limite de taxa → Meta → webhooks de status → reconciliar custo com categoria, destino, tabela e data. Template fora da janela só se aprovado e aplicável; políticas e preços sempre revalidados antes de homologação.

**Flows:** múltiplas telas dentro de uma interação, `data_exchange` criptografado/assinado conforme requisitos oficiais, sem exposições de CPF em logs. Prever fallback para menu texto e humanos.

## 10. Campanhas, cobranças e eficiência financeira

**Wizard:** público → consentimento → template aprovado → preview com variáveis → custo estimado (configurado por tabela e país, jamais hardcoded) → aprovação → execução → entrega/resposta → relatório. Pausar automaticamente por teto, opt-out, denúncia, falhas excessivas ou integração indisponível. Suportar recusa de financiamento/cobranças fora de política — não assumir que qualquer campanha de cobrança é aceita na Meta.

**Ledgers separados:** `platform_subscription` (mensalidade SaaS), `channel_usage` (Meta/provedor), `operational_cost` (infra/Storage/worker/IA), com moeda e fontes auditáveis. Simulador exibe faixa de custo e premissas; custos efetivos após eventos e relatórios do fornecedor.

**Planos comerciais sugeridos sem preço fixado:** Essencial (1 número, filas base, pequena equipe), Equipe (CRM, regras, relatório avançado), Rede (multiunidade, grants complexos, automações e integrações). Add-ons: números extras, IA, conectores, armazenamento superior. Preços, margens, quotas e taxas dependem de orçamento real, não inventar valores.

## 11. Integrações modulares (EVO não obrigatório)

Implementar `CustomerSystemAdapter` com `lookupByPhone`, `getVerifiedMemberships`, `getAccountStatus`, `getAllowedUnits` e `healthCheck`, com capacidades opcionais. `EvoAdapter` somente quando empresa conectar credenciais oficiais, com escopo/planos adequados e testes de contrato. Outros CRMs por adaptadores: ERP, agenda, sistema próprio, CRM comercial. Webhook do EVO pode criar ticket/rascunho de campanha; não presumir botão customizado no UI do EVO nem envio imediato sem regras/consentimento.

## 12. Design system e requisitos visuais

**Direção:** SaaS premium, minimalista, tipografia excelente, hierarquia clara, movimento sutil. Não copiar logos, marca nem interface integral de WhatsApp Web/Digisac.

**Tokens propostos (alteráveis por tema):**

| Token | Escuro | Claro |
|---|---|---|
| `--surface-canvas` | `#0B1011` | `#F6F8F8` |
| `--surface-panel` | `#131B1C` | `#FFFFFF` |
| `--surface-elevated` | `#1C2728` | `#F1F5F4` |
| `--text-primary` | `#F4F7F6` | `#13201E` |
| `--text-secondary` | `#9EB2AF` | `#60746F` |
| `--accent-primary` | `#22C58B` | `#07875F` |
| `--border-subtle` | `#293738` | `#DCE6E2` |

**Sistema:** escala de espaçamento 4/8/12/16/24/32, raio 8/12/16, fontes Inter ou Manrope, icons Lucide, badges de estado com rótulos (não depender apenas da cor). Tipografia 12/14/16/20/28/36, mínimos 14px em conteúdo de operação. Skeleton, vazio, offline, falha Meta/EVO, janela expirada, permissão negada, transferência pendente, canal desconectado, bot pausado, fila sem agentes. Responsivo 360, 390, 768, 1024, 1440, 1920px; atalhos teclado para desktop e acessibilidade.

**Tela principal:** Inbox com busca unificada, chips de filtros por setor/unidade/status/prioridade, agrupamento por fila, chat com mensagens e notas internas (visual distinto), coluna contexto que pode ser ocultada. Mobile com lista fullscreen e conversa com navegação clara; menus e ações sem sobrepor o composer.

## 13. Escopo por fase — não tentar fazer tudo em um deploy

| Fase | Objetivo | Saída demonstrável | Gate |
|---|---|---|---|
| 0 | Marca provisória, tokens e design system | Light/dark e componentes | Revisão visual e acessibilidade |
| 1 | Tenant, auth, cargos e grants | Usuário só acessa unidade/fila autorizada | Testes RLS e tenant isolation |
| 2 | Inbox e ticket simulados | Assumir, transferir, estados e timeline | Corridas/409/duplicidade testados |
| 3 | Motor Vi e Webchat | Menu, lookup, unidade, human handoff | Casos 0/1/N, fallback e privacidade |
| 4 | Meta oficial e Flows | Número real, webhooks, entrega e status | Webhook signature, opt-in, templates e custos |
| 5 | CRM, etiquetas, funil | Captura, dedupe e histórico | Permissões e conversão testadas |
| 6 | Campanhas, Templates e Billing | Wizard, envio idempotente e ledger | Orçamento, opt-out, limites e reconciliação |
| 7 | Integrações opcionais | EVO por tenant, depois outros | Contratos do fornecedor homologados |
| 8 | CEO, planos e hardening | Cobrança do SaaS, alertas e observabilidade | Segurança, restore, carga e suporte |

**MVP comercial recomendado:** fases 0–4, um plano simples e pouca operação de campanha. CRM completo, campanhas e conectores depois do caminho do chat estar confiável.

## 14. Definition of Done (DoD) e testes de aceite

Um recurso está pronto somente se (a) UI e estados são navegáveis; (b) autorização verificada no servidor; (c) persistência atômica sem duplicidade; (d) testes automatizados relevantes; (e) logs observáveis sem dados sensíveis; (f) documentação/rollback; (g) evidências do comportamento em celular e desktop.

**Cenários de homologação mínimos:**

1. Dois tenants não acessam contatos, números, mensagens, arquivos ou métricas um do outro.
2. Admin da Empresa A consegue criar setor corporativo sem criar unidade.
3. Um mesmo número atende unidades A e B e um atendimento muda de unidade sem trocar número.
4. Atendente da unidade A não vê dados privados da B sem grant explícito.
5. Um atendente autorizado à A e B muda de fila mantendo a mesma conta.
6. Duas pessoas clicam `Assumir` ao mesmo tempo: apenas uma recebe sucesso.
7. Transferência pendente mantém responsável até aceite conforme regra, sem mensagens duplicadas.
8. Resposta após fechamento reabre caso somente conforme política.
9. Vi coleta intenção e unidade; busca telefone em silêncio sem divulgar nome/CPF ou lista sensível.
10. Vi encontra zero, um ou vários cadastros: segue fallback, confirmação ou verificação respectivamente.
11. Timeout do EVO e indisponibilidade Meta não resultam em loop de chatbot.
12. Vi pausa após handoff humano; reativação somente por regra explícita.
13. Meta envia webhook duplicado: um evento/mensagem consolidado.
14. Fora da janela Meta, envio livre bloqueado e template válido exigido.
15. Campanha só envia para público permitido com consentimento e sem opt-out.
16. Fila respeita orçamento, pausa e idempotência; ledgers registram custo estimado/efetivo separadamente.
17. Cancelamento/promessa de pagamento não é interpretado como quitação automática.
18. CEO SaaS vê uso agregado sem mensagens privadas de clientes.
19. Todas as telas-chave têm vazio, loading, erro, sucesso, dark/light e mobile.
20. Restore de backup é testado; rotas privilegiadas têm MFA/auditoria.

## 15. Artefatos que acompanham o spec

- `docs/PRODUCT_AND_BRAND.md` — identidade, segmentos e precificação conceitual.
- `docs/UX_AND_FLOWS.md` — estados e navegação por perfil.
- `docs/SECURITY_AND_DATA.md` — tenant isolation e políticas.
- `docs/EXECUTION_PLAN.md` — sprints e prompts de execução.
- `db/001_core_schema.sql` — **referência inicial** de esquema/RLS a revisar em staging.
- `api/openapi.yaml` — contratos **propostos**, não endpoints publicados.
- `types/domain.ts` — tipos para implementação.
- `implementation/START_HERE_CODEX.md` — instruções para construir fase a fase.
- `historico/GymCore_Chat_FULL_SPEC_v1.2.md` — preservação do escopo anterior.

**Regra final:** primeiro validar o software com uma empresa fictícia e o cenário da rede 26Fit como fixture opcional. O lançamento comercial só ocorre após políticas/termos, direito marcário, conta Meta habilitada, segurança auditada, cobrança e restauração testadas.
