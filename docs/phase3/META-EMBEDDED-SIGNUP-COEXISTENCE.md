# Conectar WhatsApp Business existente ao Viante (Meta Coexistence)

## Importante
Vinculação por QR semelhante a WhatsApp Web NÃO é um mecanismo oficial de integração de aplicativos externos. O antigo QR por `wa.me` foi desativado por causar confusão. Para conectar um número do aplicativo WhatsApp Business e manter o app no celular, usar **Meta Embedded Signup (Business App Coexistence)**, se elegível.

## Estado do código, outubro de 2026
- `/app/channels`: onboarding visual com seleção da unidade e autorização explícita do proprietário com MFA.
- `/app/channels/meta-coexistence.tsx`: inicia o SDK oficial da Meta com `featureType:"whatsapp_business_app_onboarding"`, recebe OAuth code e evento de sessão.
- `/app/channels/coexistence/complete`: valida sessão do proprietário, troca autorização com a Meta em servidor, confere WABA e telefone, solicita assinatura de webhook e vincula canal à unidade.
- `/app/channels/connect`: cadastro técnico alternativo via credenciais temporárias, destinado ao time de suporte.
- `/api/webhooks/meta`: recebe e valida mensagens novas assinadas pela Meta; `/app/inbox` mostra mensagens recebidas.

**Não pronto e não ativado**:
- Exportar/importar conversas antigas, webhook `history` e `smb_message_echoes`. A Meta pode oferecer até 180 dias de chats individuais, condicionado ao compartilhamento. Grupos e todo o histórico não estão disponíveis.
- Respostas automáticas da Vi; requer token de envio empresarial persistido com proteção adequada, regras por empresa e opt-in, controle de opt-out, rate limit, janela de atendimento e monitoramento de entrega.
- Conexão real, pois ainda faltam Meta App ID, Embedded Signup Configuration ID e Meta App Secret. O botão não é habilitado sem esses dados.

## Preparação do aplicativo Meta pelo CEO (não pelo cliente)
1. No [Meta for Developers](https://developers.facebook.com/apps/), criar ou selecionar um aplicativo **Business** com produto WhatsApp.
2. Configurar Facebook Login for Business e **Embedded Signup** compatível com usuários do app WhatsApp Business (Coexistence). Revisar Business Verification, App Review, advanced permissions e eventuais limites da Meta.
3. Na Vercel, projeto `chatbox`, configurar:
   - `META_APP_ID`: ID público da aplicação da Meta.
   - `META_EMBEDDED_SIGNUP_CONFIG_ID`: ID público da configuração do Embedded Signup.
   - `META_APP_SECRET`: **App Secret** (variável privada, nunca publicá-la).
   - `META_WEBHOOK_VERIFY_TOKEN` e `VIANTE_INGEST_SECRET`: já gerados pelo servidor; não sobrescrever sem coordenar configuração do webhook/banco.
4. Configurar URL callback da Meta: `https://chatbox-cyan-five.vercel.app/api/webhooks/meta`. Usar Verify Token do ambiente seguro da Vercel.
5. Assinar webhook `messages`; para histórico/espelhamento, antes de oferecer ao cliente, implementar `history`, `smb_message_echoes` e `smb_app_state_sync`, e assinar esses campos também.
6. Publicar novas variáveis em produção, confirmar novo deploy READY, fazer login como proprietário com MFA e abrir Canais > Conectar meu WhatsApp Business.
7. Proprietário autoriza na janela oficial da Meta, escolhe número e unidade, e escaneia **apenas o QR mostrado pela Meta** se solicitado. Sem aprovação pelo usuário, Viante não deve adquirir acesso.
8. Confirmar no Supabase a associação do número, simular eventos reais e validar recebimento. Não prometer automações até implementar e testar envio seguro.

## Custos/limites
Meta pode cobrar por mensagens conforme categoria, região e regras atuais. Contas pessoais do WhatsApp Messenger geralmente precisam migrar para WhatsApp Business para o fluxo de coexistência; não tentar forçar via bibliotecas não oficiais. Histórico e alguns recursos do aplicativo têm limitações.
