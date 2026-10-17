# Viante — Fase 0

Fundação visual Next.js/TypeScript para o SaaS de atendimento Viante, conforme Spec-to-Code v2.0. **Somente demonstração: sem autenticação real, banco, canais conectados ou envio externo. Não inserir dados pessoais reais.**

## Executar

Node.js 24 LTS e npm. Não são necessárias chaves ou variáveis de ambiente.

```sh
npm ci
npm run dev
```

Acesse http://localhost:3000/login e clique em **Entrar na demonstração**.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Para testes de navegador (1440×1000 e 390×844):

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

## Incluído

- Login demonstrativo sem coletar credenciais; rota `/app/inbox` deliberadamente pública.
- Inbox com lista, conversa e contexto recolhível; desktop, navegação por telas mobile.
- Tokens grafite/verde mineral, temas claro/escuro, Inter/Manrope locais, ícones Lucide.
- Busca por contato/setor/etiqueta, filtros de atribuição e unidade.
- Ações locais: assumir, resposta, nota interna, etiqueta, aguardar, devolver à fila, concluir/reabrir e solicitar transferência.
- Transferência pendente preserva dono; aceite e transações reais ficam na Fase 2.
- Vi pausada ao assumir; mensagens fictícias em memória. Recarregar restaura a demo; apenas preferência de tema é persistida.
- Seletor de cenários pelo ícone de laboratório: loading, vazio, erro, offline, sem permissão, canal desconectado e conflito.
- Estado offline real observado via eventos do navegador; nenhuma fila de envio é criada.

## Estrutura

- `src/app`: rotas e tokens/estilos.
- `src/components/inbox`: interface, composer, contexto e transferência.
- `src/modules/inbox`: modelo local/reducer e fixtures.
- `tests`: invariantes do reducer e testes E2E.
- `docs/spec`: especificação original de referência, nunca migrações executáveis.
- `docs/STATUS.md`: verificação, limitações e próxima fase.

A aplicação está na raiz por ser uma única aplicação nesta fase. Os domínios já são separados dos componentes; packages/workers só serão criados quando houver implementação real para eles.

## Publicação e recuperação

`vercel.json` contém `git.deploymentEnabled: false`: commits não devem criar deployments por Git. Não houve publicação nem alteração remota de configuração. Antes de habilitar deploy, confirmar branch de produção e root directory no projeto Vercel existente. Preview deve ser autorizado e apontar para a branch de desenvolvimento, sem variáveis de produção.

Repositório: https://github.com/AlissonMeesPersonal/chatbox
Branch de desenvolvimento: `feat/phase-0-visual`.
O primeiro commit em main contém somente a configuração que desativa deploys por Git. A implementação da Fase 0 é entregue em branch e PR, sem merge ou publicação.

Rollback da demo: reverter o commit ou remover o preview; não há banco/migração para reverter. O SQL em docs/spec é inseguro para aplicação direta e requer revisão na Fase 1.
