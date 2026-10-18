# Viante — WhatsApp Cloud API: primeiro número de teste

## Onde o proprietário conecta o número
1. Entrar na conta da empresa no Viante: https://chatbox-cyan-five.vercel.app/app
2. Cadastrar a primeira unidade (ou usar uma existente).
3. Abrir **Conectar número WhatsApp** → \`/app/channels\`.
4. Com o aplicativo da Meta pronto, selecionar unidade, preencher **WABA ID** e **Phone Number ID**, além de um token temporário Meta com permissões de gerenciamento. O Viante consulta a lista de telefones da WABA na Meta, valida o número e solicita a assinatura \`subscribed_apps\`.
5. Em \`/app/inbox\`, visualizar mensagens RECEBIDAS por webhook após um usuário enviar mensagem ao número conectado. A lista inicial é atualizada ao recarregar a página.

## Pré-requisitos de plataforma (CEO — Meta for Developers)
- Uma **Meta App** configurada para WhatsApp Cloud API, com os produtos e permissões apropriados.
- Credencial secreta \`META_APP_SECRET\` da própria Meta App armazenada APENAS na Vercel como variável privada, para validar \`X-Hub-Signature-256\`. NÃO enviar essa credencial em chat, URL, GitHub ou campos dos clientes.
- Webhooks WhatsApp na Meta App, verificação:
  - Callback HTTPS: \`https://chatbox-cyan-five.vercel.app/api/webhooks/meta\`
  - Verify Token: valor privado de \`META_WEBHOOK_VERIFY_TOKEN\` na Vercel (criado pelo Viante).
  - Inscrever campo \`messages\` no objeto \`whatsapp_business_account\`.
- \`VIANTE_INGEST_SECRET\` é privado e já foi configurado entre Vercel e banco, não informar aos clientes.
- \`META_GRAPH_API_VERSION\` é configurável (padrão de teste atual \`v24.0\`). Revisar versão quando integrar a App real.
- Configurar a assinatura da WABA após receber token com \`whatsapp_business_management\`.
- Verificar e registrar o número na Meta, inclusive por SMS/ligação, se exigido. O campo de telefone do Viante **não** executa posse/registro do número por si.
- Os webhooks só são aceitos depois de configuração do segredo Meta; nunca ignorar assinatura.
- Incluir política de privacidade, termos e aprovação/revisão Meta ao lançar o SaaS para terceiros. A implementação atual é **manual de teste**, não Embedded Signup self-service para clientes.

## Segurança
- Credenciais Meta temporárias no formulário só chegam ao servidor Next.js via HTTPS; não são persistidas, exibidas em URLs ou logs.
- O backend verifica o token e a posse do número na WABA pela API Graph antes de registrar a associação de empresa/unidade.
- Um \`phone_number_id\` pertence a uma única unidade e não pode ser deslocado de uma empresa para outra por atualizar os campos.
- O endpoint de webhook verifica assinatura HMAC SHA-256 com comparação segura antes de processar mensagens.
- Um segredo aleatório exclusivo autentica o envio ao banco; apenas digest SHA-256 desse segredo foi mantido na tabela privada de banco.
- Eventos são deduplicados por \`meta_message_id\`.
- RLS e privilégios SQL permitem **apenas leitura** das mensagens das unidades autorizadas; usuários não podem falsificar nem alterar mensagens.
- Validações e flags de status respondem com erro se a Meta rejeitar o token ou a inscrição de webhooks.

## Limites da etapa atual
- **Receber** mensagens de texto e eventos básicos de mídia, exibindo placeholder para mídia. Não baixa anexos nem envia respostas.
- Não possui ainda troca de mensagens, funil, agentes e roteamento automático.
- Não está conectado a nenhum número real até o proprietário executar o fluxo após configuração da Meta.
- Nunca afirmar que receber mensagens está funcionando na produção antes de testar um evento real, de ponta a ponta.
