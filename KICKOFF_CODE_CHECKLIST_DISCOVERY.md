# KICKOFF — AJUSTE DO CHECKLIST DE DISCOVERY — cole no Claude Code

Objetivo: corrigir o fluxo do checklist de discovery para que seja marcável, extensível e integrado ao progresso do módulo. Ajuste pequeno e cirúrgico — não mexer em mais nada.

## Problema atual

Na aba de onboarding de cada pilar, o bloco "Quais dados coletar e onde" e o "Checklist de Discovery" hoje não são plenamente funcionais: os itens não são marcáveis de forma persistente e não há como o usuário adicionar itens próprios.

## O que fazer

1. Unificar a fonte de dados: "Quais dados coletar e onde" e "Checklist de Discovery" do pilar devem ser o MESMO componente/estado, não dois desalinhados. Se hoje são duas coisas separadas, consolide numa só lista de itens de discovery do pilar.

2. Cada item da lista é:
   - marcável (checkbox), com estado persistido (IndexedDB), por pilar;
   - categorizável como CAMPO ou DESK (herda a separação já existente);
   - editável e removível.

3. Botão "+ Adicionar item" permite ao usuário inserir um novo item de checklist custom naquele pilar (texto + categoria campo/desk). Itens custom persistem junto dos itens padrão.

4. O progresso do checklist (itens marcados / total) deve alimentar o indicador de progresso do módulo na Home. Definir de forma transparente: progresso do discovery = % de itens marcados.

5. Preservar os itens padrão que vêm da spec/onboarding como base inicial; o usuário marca e adiciona por cima, sem perder os padrão.

## Critérios de pronto

1. Marco um item de discovery num pilar, fecho e reabro o app, o item continua marcado.
2. Adiciono um item custom via "+", ele aparece, é marcável e persiste.
3. O progresso do módulo na Home reflete os itens marcados.
4. Nenhuma regressão no onboarding, no funil de discovery ou no resto do pilar.

## Conduta

- Escopo travado neste componente. Se mudança de schema for necessária (campo de checklist custom), passa pelo architect e atualiza docs/DATA_MODEL.md.
- qa-reviewer valida os 4 critérios.
- Commit descritivo + CHANGELOG + teste manual em até 5 passos.
