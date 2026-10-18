# Viante — e-mail próprio por unidade

## Modelo aprovado
- **Uma empresa / organização** é cadastrada pelo CEO. Não criar outra organização ao adicionar uma unidade.
- O proprietário tem uma conta principal e acessa todas as unidades da própria empresa.
- O proprietário cadastra unidades agora ou no futuro. Cada unidade pode ter seu e-mail de acesso, informado durante a criação ou mais tarde.
- Cada e-mail recebe um convite autenticado. O vínculo à empresa e à unidade é determinado pelo banco de dados; **não** pelo domínio ou texto do e-mail.
- O e-mail da unidade é uma identidade de usuário Supabase Auth. Após confirmação e MFA, o usuário recebe a função `manager` na empresa e vínculo só com as unidades convidadas.
- A mesma identidade pode ser vinculada a mais de uma unidade, mediante convites separados.
- O e-mail de uma unidade **não** obtém acesso geral da empresa, não cria outra empresa e não consegue adicionar unidades sem permissão owner/admin.

## Fluxo proprietário
1. CEO cria a empresa e convida o proprietário; o proprietário confirma e-mail, habilita MFA e aceita o convite.
2. Proprietário entra em `/app`. Em **Cadastrar unidade**, digita nome e, opcionalmente, e-mail responsável. O sistema cria a unidade e o convite na **mesma transação**.
3. Se o e-mail foi omitido, o proprietário pode convidar o responsável depois, dentro do cartão dessa unidade.
4. O proprietário vê status de cada convite e pode revogar os pendentes ou reenviar (a reemissão substitui o identificador antigo).
5. O sistema pede ao Supabase Auth o envio de link único. O envio ter sido aceito pela API não garante entrega ao destinatário.

## Fluxo e-mail da unidade
1. Destinatário abre o link `/auth/finish?flow=unit&invite=<uuid>` enviado pelo Supabase Auth.
2. Login e confirmação de e-mail acontecem no Supabase Auth, e os tokens são trocados por cookies HttpOnly.
3. Em `/accept-unit-invite`, configura/verifica MFA TOTP.
4. RPC `viante_accept_unit_invite` valida o e-mail confirmado de `auth.users`, exige `aal2`, convite pendente não expirado, e impede vinculação de administradores CEO.
5. RPC registra `viante_memberships` e `viante_unit_memberships` apenas para a unidade convidada. Conta suspensa não é reativada por convite antigo.
6. No primeiro acesso, a pessoa define senha e entra em `/app`; a listagem de unidades usa RLS para mostrar somente as autorizadas.

## Segurança e próximos testes
- Convites ficam em `viante_unit_invitations`, com RLS e sem SELECT direto a clientes.
- As funções administrativas verificam a associação ativa de owner/admin e MFA, independentemente dos elementos da interface.
- Alterações de unidade e convite usam POST com origem verificada; nenhuma chave de serviço é exposta no navegador.
- Validar ponta a ponta com e-mails distintos reais, inclusive duas unidades, usuário com ambas, convite expirado, tentativa de aceitar com endereço errado e revogação.
- Supabase Authentication > URL Configuration deve aceitar `https://chatbox-cyan-five.vercel.app/**`, e o envio transacional por SMTP deve estar configurado para uso comercial.
- Advertência existente do Security Advisor: proteção contra senhas vazadas desativada; habilitar em Supabase Auth.
- A Inbox real, integração Meta e gestão de assinaturas não estão contempladas neste fluxo.
