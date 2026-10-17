# Segurança, LGPD e banco multiempresa

## Fronteira de tenant

- Cada objeto de negócio tem `tenant_id`, índices compostos e relacionamentos evitando IDs de outro tenant.
- `auth.uid()` identifica usuário, tabela de memberships identifica tenant; API valida sessão + vínculo + grant; RLS faz segunda barreira.
- Não aceitar `tenant_id` arbitrário no body para autorizar; roteamento de workspace depende de sessão/grant.
- CEO da plataforma não é admin dos dados do cliente; painel agregado não dá acesso à caixa de entrada.
- Service role não é disponível no browser; webhook oficial rodando em servidor valida assinatura e resolve tenant pelo canal confiável.
- RLS também em Storage (paths com prefixo de tenant, validação servidor) e tabelas de mensagens/campanhas.

## Identidade do contato

Telefone E.164 é sinal de correspondência, nunca autenticação forte. Se dados sensíveis ou detalhes de vínculos serão revelados, exigir método de verificação autorizado e adequado ao risco. Evitar CPF em chat quando houver alternativa menos invasiva. Se necessário, capturar em etapa segura, mascarar/criptografar, registrar propósito, prazo de descarte, sem logs nem analytics.

## Campanhas

Opt-in/opt-out por canal e finalidade; templates aprovados e classificação de política Meta verificada, inclusive restrições de cobrança. Bloquear tentativa sem consentimento adequado, ou após opt-out. Registrar evidência de consentimento, timestamp e origem; limiar e alerta de abuso. Nunca implementar bypass via automação não oficial WhatsApp Web.

## Segurança operacional

- MFA obrigatória para papéis privilegiados, convite de ativação, revogação sessão.
- Trilha append-only para alterações: grants, transferências, campanhas, templates, confirmações financeiras, integrações, acessos excepcionais.
- Rate limit por tenant/usuário/canal e requisição, anti-CSRF, CSP progressiva, controle CORS, uploads com MIME/tamanho, verificação malware quando disponível.
- Webhook: validar assinatura no corpo original e idempotência por evento/provider; processar assincronamente; chave secreta com rotação.
- Fila: reintento exponencial com jitter, dead-letter queue, idempotency key, orçamento reserva/estorno, telemetry.
- Backups com política de retenção e teste real de restauração; secrets no gerenciador do provedor; rollback de migrações.
- Data retention configurável para mensagens/anexos; exportação e exclusão sujeitas a obrigações legais aplicáveis.

## Checklist de ameaça

1. URL com ID de caso de outro tenant → 403/404 sem dados.
2. Mensagem outbound enviada com `tenant_id` alterado → negada.
3. Atendente de unidade A pedindo exportação da B → negada.
4. Transferência para tenant diferente → negada.
5. Duplo clique no envio → apenas um registro externo.
6. Webhook repetido/out of order → status reconciliado, sem mensagens duplicadas.
7. CPF/mensagem privada em logs/erro → proibido e testado.
8. Token Meta/EVO em HTML/JS cliente → proibido.
9. Cancelamento de plano SaaS → política de acesso/retenção explícita; nenhum dado apagado silenciosamente.
10. Superadmin tentando ler mensagem diretamente via UI → proibido por desenho, exceção sujeita a trilha especial.

## DoD de segurança

Executar testes RLS (anon, agent, supervisor, tenant_admin e tenant cruzado), scan de dependências, análise de APIs com autenticação, restore de backup, política de retenção, revisão de templates e LGPD antes do primeiro cliente real.
