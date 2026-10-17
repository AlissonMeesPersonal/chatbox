# Viante — produto, identidade e preços (proposta)

## Posicionamento

**Marca de trabalho:** Viante. **Tagline:** "Toda conversa no lugar certo." **Assistente:** Vi, nome editável no painel de cada empresa. Não validar domínio, marca ou exclusividade a partir de buscas informais; realizar consulta INPI, classes adequadas, domínio e parecer jurídico/comercial antes do lançamento.

**Mensagem principal:** Atendimento centralizado para empresas que têm muitos canais, pessoas ou unidades. Uma empresa pode conectar um único número para toda a rede, distribuir automaticamente por setor/unidade e acompanhar o resultado em uma caixa de entrada.

## Segmentos sem compromisso com vertical

- Comércio/lojas: vendas, pedidos, trocas, entrega.
- Clínicas: recepção, agendamento, administrativo (cuidado com dados sensíveis).
- Academia: comercial, suporte, cancelamento, conector EVO opcional.
- Educação: matrículas, secretaria, financeiro.
- Serviços: orçamento, agenda, relacionamento.

**Proibição no domínio:** `student_id`, `gym_id`, `member_enrollment` como campos obrigatórios. `external_identifier` em `contact_links` com `provider` é o suficiente para integrar sistemas diferentes.

## Marca e design

- Arquitetura visual: preto profundo / grafite / verde mineral, estilo funcional premium, sem efeitos extravagantes.
- Tipografia: Manrope para títulos, Inter para conteúdo; fallback sistema; fontes otimizar carregamento.
- Logo proposta a ser desenhada posteriormente: logotipo de letra "V" modular ou diálogo composto por duas linhas convergentes; não usar logo WhatsApp nem de concorrente.
- Personalização tenant: nome de exibição, avatar, nome do assistente, logo, cor de destaque e horários; não quebrar consistência de plataforma.
- Voz UI: clara, curta, concreta. Alertas em português, i18n preparado.

## Comercial e unidade econômica

**Planos conceituais (sem preço definido):**

| Plano | Cliente | Recursos de entrada | Limite sugerido a parametrizar |
|---|---|---|---|
| Essencial | Empresa pequena | 1 número, inbox, Vi simples, 1 unidade, equipes básicas | agentes, Storage, automações |
| Equipe | Média empresa | CRM, múltiplos setores, campanhas, relatórios | agentes, unidades, números |
| Rede | Franquias/redes | 1 número distribuído, múltiplas unidades, grants e filas avançadas, API | SLA, integrações, uso e suporte |

**Modelo de preço recomendado:** mensalidade SaaS + consumo de mensagens Meta repassado de forma transparente + complementos opcionais. Não apresentar preços de Meta fixos no código; consultar tabela vigente, país, categoria e moeda. Separar previsão de custo, custo de provedor confirmado e markup, se algum, explicitamente. Orçamento de campanha com teto e autorização.

**Minimização de custo:** reutilizar infraestrutura multi-tenant, usar webchat próprio sem tarifa de canal, evitar IA obrigatória, Redis só se necessário, arquivo com retenção planejada, jobs via worker durável, índices de consultas críticas. Vercel/Supabase têm quotas, cobrança por uso e limites — validar consumo antes do lançamento.

## Naming pendente

Viante é **somente nome de trabalho**. Foi realizada busca exploratória, não clearance de marca, domínio ou INPI. Todos os nomes e logotipos devem ser parametrizados via `product_brand` e `tenant_branding` para renomear sem alterar nomes de tabelas, APIs nem dados.
