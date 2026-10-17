# UX, fluxos e matriz de interface

## Estrutura do produto

**Shell plataforma:** Dashboard SaaS, Empresas, Planos, Consumo, Incidentes, Auditoria e Suporte. Sem leitura padrão de conversas de clientes.  
**Shell empresa:** Inbox, Contatos, CRM, Leads, Funis, Campanhas, Cobranças, Automação Vi, Filas, Equipe, Relatórios, Integrações, Uso, Configurações. Menus condicionados a capacidades server-side.

## Design desktop e mobile

**Desktop 1440px:** rail esquerda 72; lista de conversas 340; chat flex 1; perfil contextual 320 recolhível. Header sempre exibe empresa/unidade/fila contextual e estado do canal. Conversas têm status, SLA, unread, prioridade, responsável, tags e última mensagem. Chat mostra mensagens em horários, anexos, mensagens próprias, notas internas com visual próprio, bot/humano, indicador de janela Meta.

**Tablet 768–1023px:** rail colapsada, lista + conversa alternáveis, detalhes drawer. **Mobile 360–767px:** navegação por telas: caixa → thread → perfil, ações no overflow, composer fixo, seleção de destino fullscreen, sem tabelas horizontais gigantes. Atalhos teclado desktop; estado de foco acessível.

**Modais e estados obrigatórios:** loading, empty, error, offline, forbidden, channel_disconnected, awaiting_Meta_approval, message_outside_window, template_rejected, waiting_assignment, assigned_elsewhere, transfer_pending, conflict_409, bot_paused, sync_delayed. Mensagens de erro sem expor secrets.

## Fluxo 01 — único número e triagem da Vi

```text
WhatsApp rede → webhook → localizar contato por telefone em silêncio
→ Vi mostra menu (ou Flow) → pessoa escolhe opção
→ unidade: sugerir 1 / escolher N / manual quando não encontrado
→ verificar identidade antes de mostrar dados protegidos
→ etiquetas de setor + unidade + intenção
→ fila → um operador assume atomicamente
→ bot silenciado enquanto houver atendimento humano
```

**Preços:** cliente que apenas seleciona uma tela do Flow não produz nova mensagem de WhatsApp, mas mensagem de abertura e respostas de texto são tarifadas segundo regras atuais. As tarifas devem ser validadas antes da integração, não há garantia de gratuidade ilimitada.

## Fluxo 02 — transferência

- Um operador clica Transferir e vê apenas destinos autorizados.
- Escolhe setor, unidade opcional, fila, atendente opcional e anexa nota interna.
- Se aceitação for obrigatória, cria `transfer_pending` sem retirar propriedade do operador origem.
- Notifica destino e supervisor; um operador habilitado aceita; servidor troca ownership com transação.
- UI de origem fica read-only ao perder ownership; thread preserva mensagens e tags.
- Rejeição/timeout devolve à origem com registro auditável. SLA preserva eventos.

## Fluxo 03 — multiempresa

- Operador pode ser membro de Empresa A e B; muda workspace explicitamente.
- Ao mudar, recarrega permissões, consultas e cache do tenant. Não persistir dados A no estado visual de B.
- Concessões por unidade/setor/filas configuradas por administrador. Negar qualquer ID de outro tenant, mesmo enviado manualmente pela URL.

## Fluxo 04 — campanha

Público com consentimento e exclusões → template aprovado → revisão variáveis → previsão custo → aprovação gerente → scheduler/worker → monitoramento por destinatário → leitura/resposta → roteamento para inbox → reconciliação de custo.

## Fluxo 05 — onboarding

Cadastro autorizado → escolher plano → empresa e marca → convidar equipe → setores iniciais → unidades opcionais → fluxo Vi padrão → canal demo Webchat → Meta Embedded Signup depois → primeira conversa simulada → publicação após verificação da integração.

## Campos exibidos no perfil do contato

Nome preferido, telefone mascarável, origem, etiquetas, histórico de casos, último canal, setor/unidade atual, status de verificação, tarefas e próximas ações. Nunca revelar por padrão CPF completo nem unidades ligadas a registros potencialmente de terceiros.

## Navegação e controle por perfil

- CEO: apenas `/platform/*` e apoio técnico autorizado.
- Admin empresa: menu completo do tenant, respeitando feature flags.
- Gestor unidade: Inbox de sua unidade, equipe local, relatórios e contatos pertinentes; sem integrações/assinaturas salvo grant.
- Supervisor: Filas, Inbox e indicadores; sem gestão de contratos do SaaS.
- Agente: Inbox, contatos e tarefas que lhe foram permitidos; esconder CRM global, campanhas e configurações.

Toda autorização negada retorna 403 server-side; rotas e queries protegidas. Confirmar em e2e que deep links não burlam ocultação visual.
