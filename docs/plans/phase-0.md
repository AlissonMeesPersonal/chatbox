# Viante Fase 0 — plano de implementação

Objetivo: entregar login demo e Inbox premium responsiva com ações exclusivamente locais.
Spec: ../spec/SPEC_TO_CODE.md e ../spec/implementation/START_HERE_CODEX.md.
Arquitetura: Next.js App Router na raiz (app única; evita configurar root directory na Vercel); módulos de domínio separados de componentes. Sem endpoints ou conexão com banco nesta fase.

1. Fundação: package/lockfile, TypeScript strict, ESLint, tokens, fontes locais, layout e login /login → /app/inbox.
2. Inbox: fixtures fictícias, reducer puro de ações, filtros, assumir (pausa Vi), responder, nota interna, concluir/reabrir, transferência pendente, etiquetas e contexto. Testar invariantes do reducer com node:test.
3. Estados: seletor explícito de cenários de demonstração: loading, vazio, erro, offline, sem permissão, canal desconectado e conflito. Ações bloqueadas coerentemente.
4. Qualidade: lint/typecheck/build, smoke com Playwright em 390 e 1440, temas, teclado e modal. Revisão Codex Security sem mudanças remotas.
5. Entrega: documentação e branch feat/phase-0-visual. Sem merge, migração ou deploy de produção.

Foco da revisão: rascunho não atravessa conversas; conteúdo do cliente renderizado como texto; estado offline impede envio; transferência pendente mantém dono; detalhes mobile não escondem navegação.

Decisões: escopo e direção visual aprovados no prompt anexado; execução autônoma nativa. Não repetir aprovação de design. Repositório vazio exige primeiro commit; impedir deploy Git via vercel.json até autorização de publicação. SQL de referência permanece apenas em docs/spec, nunca em migrations.
