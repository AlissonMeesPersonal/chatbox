# Viante — Bootstrap CEO (17/10/2026)

Supabase alvo: `idmqygvbtofkmbccazyp`. E-mail de CEO solicitado: `alissonmeespersonal@gmail.com`.

Migrações aplicadas:
- `viante_ceo_bootstrap_pending_verified_identity`: schema privado `viante_private`, `ceo_bootstrap` com e-mail reservado e não consumido; `public.viante_platform_admins` sem escrita pelo cliente e RLS habilitado.
- `viante_platform_admins_self_read_policy`: apenas leitura da própria condição de administrador, sem INSERT/UPDATE/DELETE pelo cliente.

Estado confirmado: `auth.users` está vazio; logo **não existe conta CEO nem login funcional**. O bootstrap privado está PENDENTE, nunca equivale a autenticação ou elevação de privilégio. Nenhuma senha criada, nenhum link mágico ou convite enviado.

Próximo trabalho de código obrigatório: instalar e versionar Supabase SSR com lockfile, implementar login/callback/recuperação/rotas protegidas, provedor de onboarding server-side que verifica e-mail confirmado e MFA forte contra auth.users e concede a vinculação em transação. Nunca confiar no endereço de e-mail informado pela interface ou JWT user_metadata para autorização. Implementar Dashboard CEO separado da Inbox do tenant. Configurar environment Vercel Preview (publishable URL/key) e testar login no browser com usuário real. Não liberar CEO apenas com whitelist de e-mail.

O SQL executado deve ser sincronizado nas migrações versionadas do repositório após conciliação do spec.
