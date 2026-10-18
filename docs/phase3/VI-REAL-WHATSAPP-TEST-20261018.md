# Viante — teste real de mensagens e respostas automáticas Vi

Status: implementado no código na branch main, ainda **não conectado a um número Meta real**.

## Fluxo esperado
1. O CEO prepara o Meta Business App com WhatsApp Cloud API, Facebook Login for Business e WhatsApp Business App Coexistence / Embedded Signup.
2. Na Vercel (projeto chatbox), configurar `META_APP_ID`, `META_EMBEDDED_SIGNUP_CONFIG_ID`, `META_APP_SECRET`. Esses valores não podem ser inventados. O App Secret fica como encrypted, nunca no navegador ou GitHub.
3. Verificar o webhook em `https://chatbox-cyan-five.vercel.app/api/webhooks/meta` com `META_WEBHOOK_VERIFY_TOKEN` e assinar o campo `messages`.
4. O proprietário acessa `/app/channels` com MFA, seleciona sua unidade e clica **Conectar meu WhatsApp Business**. O fluxo oficial da Meta pede autorização e, se elegível, preserva o aplicativo.
5. Após troca de código OAuth e validação WABA/Phone Number ID, o token por canal é cifrado por AES-256-GCM em `viante_private.vi_channel_tokens`. A chave AES está apenas em `VIANTE_TOKEN_ENCRYPTION_KEY` (Vercel).
6. O proprietário ativa **Ativar respostas da Vi** para o número específico. A ativação exige MFA e vínculo owner/admin ativos. O padrão sempre é DESLIGADO.
7. Outro celular envia “Olá” à unidade. O webhook valida a assinatura HMAC da Meta, armazena a mensagem e, se a Vi estiver habilitada, gera resposta idempotente pelo menu 1/2/3. A resposta é enviada pelo endpoint Meta Graph `/<PHONE_NUMBER_ID>/messages`, usando **somente o token cifrado daquele canal**.
8. No `/app/inbox` aparecem as mensagens recebidas e as respostas da Vi com estado (pendente/enviando/aceita pela Meta/falha). “Aceita” não é confirmação de entrega.
9. O cliente pode enviar MENU para retornar às opções e PARAR para silenciar. Ao escolher planos/cancelamento/humano, a Vi para de responder naquela conversa e o dono do WhatsApp Business pode assumir manualmente pelo aplicativo. **Não existe ainda atribuição automática de operador nem resposta humana pela interface Viante**.

## Segurança e limitações
- Meta assinaturas são obrigatórias. Não fazer conexão por engenharia reversa de WhatsApp Web.
- Todas as mensagens automáticas são resposta a uma mensagem recebida, dentro da janela de atendimento (24h). Fora dela, Meta normalmente exige template autorizado.
- Não enviar mensagem proativa, cobrança ou marketing sem autorização e regras de WhatsApp Business.
- O sistema é um piloto de respostas de texto. Áudio, imagens, grupos, importação do histórico, mídia, filas de atendentes, handoff e notificações de entrega são trabalho futuro.
- O outbox de Vi e o estado dos clientes são tabelas privadas. Mensagens têm identificação única do webhook e tentativas controladas. Erros de rede podem exigir nova tentativa; a Meta pode reenviar o mesmo evento.
- Viante pode ser usado multiempresa no banco, mas a aprovação do aplicativo Meta, cobrança e políticas de plataforma devem ser revisadas antes de distribuir comercialmente.
- Para um teste manual de um só número sem fluxo integrado, o código possui fallback opcional `META_TEST_PHONE_NUMBER_ID` e `META_TEST_WHATSAPP_TOKEN` na Vercel, válidos **apenas** para o Phone Number ID exato. Preferir Embedded Signup seguro ao longo prazo.
- Não colar credenciais de Meta, PIN, QR real de autorização ou tokens em chats, screenshots ou repositórios.
- Habilitar leaked password protection em Supabase Auth (alerta de segurança já apontado pelo advisor).

## Pré-requisitos pendentes do projeto
- Não existem ainda `META_APP_ID`, `META_EMBEDDED_SIGNUP_CONFIG_ID` ou `META_APP_SECRET` na Vercel: onboarding continua bloqueado até configurar.
- Não há nenhum canal real registrado no Supabase até a autorização do proprietário.
- Fazer teste ponta a ponta com dois números reais para provar autorização, webhook assinado e resposta entregue.
