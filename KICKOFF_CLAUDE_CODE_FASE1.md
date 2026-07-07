# KICKOFF — cole isto no Claude Code

Antes de colar: crie a pasta do projeto e coloque dentro dela o arquivo `SPEC.md` (o documento completo do Masterplan São Borja) e o JSON exportado da ferramenta de campo (se já tiver).

---

Leia SPEC.md por completo antes de qualquer ação. Ele é a única fonte de verdade deste projeto. Não improvise fora dele.

Sua missão agora é EXCLUSIVAMENTE a Fase 1 (Fundação), como definida na spec. Não adiante nada das fases 2-5.

Execute nesta ordem:

1. Crie os subagents em .claude/agents/ e as skills em .claude/skills/ conforme a seção "TIME DE AGENTES" da spec.
2. Apresente para minha aprovação, ANTES de escrever qualquer código de aplicação:
   a. Estrutura de pastas proposta;
   b. Schema TypeScript completo das 9 entidades;
   c. Plano de migração do JSON da ferramenta de campo ({ativos, stakeholders, registros}) para o novo modelo.
3. Só após meu OK explícito, implemente a Fase 1 completa.

Critério de pronto da Fase 1 (não negociável): eu importo meu JSON de campo real, vejo ativos/stakeholders/registros dentro do app, fecho o navegador, reabro, e os dados persistem via IndexedDB. Export de backup JSON funcionando.

Regras de conduta:
- Toda mudança de schema passa pelo agent architect.
- Nenhum dado de exemplo realista — placeholders obviamente fictícios ou vazios.
- Ao terminar: commit descritivo, atualizar docs/CHANGELOG.md, e me entregar instruções de teste manual em 5 passos ou menos.
- Se algo na spec estiver ambíguo, pergunte antes de assumir. Não expanda escopo por conta própria.
