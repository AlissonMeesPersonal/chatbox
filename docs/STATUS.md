# Estado da rodada — 17/10/2026

## Escopo entregue

Fase 0 implementada; entrega remota por branch/PR. Homologação visual pendente. Nenhuma migração, autenticação, canal Meta/EVO, Realtime ou custo de infraestrutura criado. Todas as identidades e conversas são fictícias.

## Inspeção externa

- GitHub `AlissonMeesPersonal/chatbox`: público, size 0, branch padrão main, nenhuma branch existente.
- Vercel `chatbox`: existente, framework não configurado, Node 24, nenhum deployment, live=false. Consulta não expôs vínculo Git/production branch; não presumido como verificado.
- Supabase `idmqygvbtofkmbccazyp`: consulta de metadados recusada por falta de permissão. Nenhum schema/dado lido ou alterado.

## Verificação

- Lint, TypeScript strict, build Next.js: executados com sucesso.
- 6 testes de domínio: passaram (claim/Vi, transferência, bloqueio de envio, nota/texto, vazios/duplicidade, dono existente).
- npm audit --omit=dev --audit-level=high: 0 vulnerabilidades reportadas nas dependências de produção.
- 6 cenários Playwright (3×2 resoluções) criados. Tentativa de execução falhou antes das interações: Chromium ausente. Download não autorizado pela política de rede. Não são testes aprovados.
- Navegador conectado não alcançou localhost do ambiente (ERR_CONNECTION_REFUSED). Sem screenshots/validação visual concluída.
- Revisão independente do código identificou abertura dos detalhes mobile e vazamento de rascunho de etiqueta entre contatos; corrigidos com abertura explícita e chave do componente por ticket.
- Codex Security: skill disponível durante a tentativa, mas referências auxiliares não puderam ser carregadas e depois o catálogo de skills cloud ficou indisponível. Nenhum scan Codex Security concluído ou selo de segurança alegado.

## Revisão de superfície desta demo

Não há endpoints de dados, credenciais, SDK Supabase, fetch de mensagens ou writes externos. React renderiza mensagens como texto escapado. Um script inline fixo lê apenas tema; nenhum conteúdo do usuário é interpolado em HTML. CSP restringe origens, frames e formulários; usa unsafe-inline para hidratação Next nesta demo. CSP com nonce/hash deve ser avaliada antes de autenticação real. Reducer local não é fronteira de segurança nem prova de concorrência/distribuição.

## Divergências reservadas à Fase 1

Referências originais foram preservadas em docs/spec e não aplicadas:

1. `messages_read` autoriza histórico da thread por qualquer ticket visível, podendo vazar outros casos/setores. Exigir vínculo/visibilidade por mensagem e política explícita de histórico compartilhado.
2. `channels_read` libera membros genericamente. Contatos, vínculos e notas precisam escopo granular.
3. SQL concede role no membership; tipos preveem role também por grant. Harmonizar contrato.
4. TransferRequest/SQL não incluem claramente destinatário por usuário, apesar do OpenAPI `toUserId`.
5. Consistência tenant/unidade/setor/fila não é garantida por FKs individuais. Validar relações compostas e transações.
6. CustomerSystemAdapter no texto inclui getAccountStatus/getAllowedUnits ausentes nos tipos. Harmonizar quando implementar conector.
7. OpenAPI lookup usa escape de regex divergente do SQL; validar schema com testes de contrato antes de expor API.
8. Revisar grants, SECURITY DEFINER/search_path, operações de escrita, revogação session_id, MFA e políticas Storage/Realtime antes de dados reais.

## Próxima rodada

Concluir inspeção visual 390/1440 e revisar o PR; depois Fase 1: Supabase Auth, empresas, memberships/grants, MFA, sessões e testes de isolamento. Supabase precisa conceder acesso ao projeto correto pelo conector. Sem pedir ou publicar chaves administrativas no chat.

## Fontes técnicas consultadas

- https://nextjs.org/docs/app/getting-started/installation
- https://vercel.com/docs/git/vercel-for-github
- Versão Next.js 16.4.2 confirmada na documentação e registry npm; demais versões exatas no package.json/package-lock.json.

## Entrega GitHub

Após autorização para trabalhar diretamente no repositório, main foi inicializada somente com vercel.json bloqueando deploys automáticos. Código entregue na branch feat/phase-0-visual, sem merge.
