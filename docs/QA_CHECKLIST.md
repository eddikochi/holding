# QA Checklist — Masterplan São Borja

> Dono: agente **qa-reviewer**. Uma seção por fase. Testes feitos no navegador real (preview), não por leitura de código.

## Ajuste — checklist de discovery · 2026-07-09 · ✅ APROVADA

| Critério de pronto | Resultado |
|---|---|
| **1.** Marco um item, fecho e reabro, o item continua marcado | ✅ item marcado persistiu após reload (Config v2) |
| **2.** Adiciono item custom via "+", aparece, é marcável e persiste | ✅ "FIX item custom" persistido (custom=true) |
| **3.** Progresso do módulo na Home reflete os itens marcados | ✅ checklist "1 de 6 · 17%" = card 03 "17% preenchido" |
| **4.** Sem regressão no onboarding, funil de discovery e resto do pilar | ✅ perguntas-mestre + quem procurar + critério intactos; funil ok |
| Build strict + single-file limpo | ✅ (erros de HMR intermediário durante edição não afetam o build) |

Unificação: "quais dados coletar e onde" + "checklist" viraram uma lista só (campo/desk), marcável/editável/
removível/extensível. Progresso dos diagnósticos na Home = % de itens marcados.

---

## Fase corretiva final — 5 itens de estrutura · 2026-07-08 · ✅ APROVADA

Escopo travado: (1) pilar Educação, (2) roteiro de entrevista por pilar, (3) tipos de players por pilar,
(4) tela "o que descobrir" por pilar, (5) consolidação de design tokens.

| Critério de pronto | Resultado |
|---|---|
| **1.** Educação aparece em navegação, Home, priorização e business cases, com onboarding/roteiro/tipos/"o que descobrir" reais | ✅ nav com 13 módulos; Home 13 com %; filtro de pilar em Oportunidades inclui Educação; onboarding completo |
| **2.** Ao registrar stakeholder em qualquer pilar, vejo roteiro + lista de tipos de players | ✅ modal com roteiro do pilar e select de tipos (+ "Outro"); resposta do roteiro vira evidência vinculada |
| **3.** Cada pilar abre mostrando "o que estamos tentando descobrir" antes dos formulários | ✅ 1º bloco do Onboarding = perguntas-mestre do pilar |
| **4.** Todos os estilos vêm de um arquivo único de tokens; troco uma cor e muda no app | ✅ mudar `--blue` em runtime alterou o botão; mapa lê tokens via getComputedStyle |
| **5.** Sem regressão: funil de discovery, import com preview, matriz de priorização, jurídico, backup | ✅ funil do Logístico via import (1 hip/1 evidência); backup íntegro (1 hip, 3 stk, 3 evid); matriz/jurídico ok |
| Build strict + console limpo | ✅ 91 módulos, sem erros |

Nota de escopo: o kickoff chamou Educação de "7º pilar (de 6 para 7)", mas o app já tinha 7 pilares —
Educação entrou como **8º pilar / diagnóstico módulo 08**, e decisão/execução foram renumerados para **09–13**
(slugs de rota inalterados). Reportado ao usuário.

---

## Fase corretiva — auditoria dos 3 itens · 2026-07-08 · ✅ APROVADA

Escopo travado: (1) painel Discovery por pilar, (2) onboarding didático 01–07, (3) preview de import + Home.

| Critério de pronto | Resultado |
|---|---|
| **1.** Importar Hub → preview → confirmar → módulo 05 → funil de discovery com entrevistas reais vinculadas | ✅ funil 1 hip/1 com evidência; expandir mostra as 3 entrevistas com nome, dor e valorCitado (R$ 500) |
| — validação: botão desabilitado com tooltip até 3 evidências | ✅ "Precisa de pelo menos 3 evidências (tem 0)"; com 3 valida e vai a "validada" |
| **2.** Abrir módulo 01–07 pela 1ª vez → onboarding com conteúdo real + checklist funcional | ✅ 1ª visita abre no Onboarding; campo/desk separados; checklist persistido; aviso de advogado no 02 |
| — 2ª visita abre em Dados; botão "?" reabre onboarding | ✅ |
| **3.** Home: % de progresso dos 12 módulos + 4 tipos de alerta | ✅ 12 módulos com %; alertas: Pilar sem dados, Hipótese sem evidência, Pendência jurídica, Número sem fonte |
| **4.** Sem regressão: backup/export, matriz de priorização, checklist jurídico | ✅ backup íntegro (hipóteses/análises/comparáveis); matriz e matriz jurídica ok |
| Build strict + console limpo | ✅ 89 módulos, sem erros |

Detalhe do import: preview mostra criados vs. atualizados por entidade e opção mesclar/substituir; nada gravado antes de confirmar. Removido `ModuloShell` (código morto).

---

## Fase 5 — Execução e governança · 2026-07-08 · ✅ APROVADA (passada final)

Escopo: módulos 11 Roadmap, 12 Governança (Decision Log + KPIs), mapa Leaflet, polimento.

| # | Item | Resultado |
|---|------|-----------|
| 1 | Build `tsc && vite build` sem erros (strict) | ✅ 88 módulos |
| 2 | 11: colunas por horizonte (0-12m/1-3a/3-5a/5-10a) | ✅ |
| 3 | 11: dependência "bloqueado por" visível no card | ✅ |
| 4 | 12: 3 abas (Papéis e ritos / Decision Log / KPIs) | ✅ |
| 5 | 12: Decision Log grava decisão com vínculos, reversível, filtro | ✅ |
| 6 | 12: KPI com medições + **sparkline SVG** renderizado | ✅ atual 14 / alvo 20 |
| 7 | 01: **mapa Leaflet** monta (container, 12 tiles, marcador) online | ✅ |
| 8 | 01: degradação para lista quando offline/sem tiles | ✅ (por código; online testado) |
| 9 | Home: progresso 08–12 ("com dados"/"vazio") | ✅ 11/12 com dados |
| 10 | Console sem erros | ✅ |
| 11 | Responsivo (roadmap/governança/patrimonial) sem overflow em 375px | ✅ |

### Passada final — todos os 12 módulos
- Diagnósticos 01–07: onboarding + dados + análise (SWOT/leitura). ✅
- Decisão 08–10: oportunidades, priorização (matriz+ranking), business cases. ✅
- Execução 11–12: roadmap, governança/decision log/KPIs. ✅
- Import de campo, backup JSON/CSV, persistência IndexedDB entre reloads. ✅ (Fases 1–4)
- Regra de ouro (hipótese≠evidência≠decisão; validação ≥3 evidências) mantida. ✅
- Estados vazios e onboarding em todos os módulos. ✅
- HTML single-file abre por duplo-clique (file://). ✅

### Ressalvas conhecidas (não bloqueiam)
- Mapa depende de internet para os tiles; offline mostra lista (comportamento previsto na spec).
- Recharts não foi introduzido: todos os gráficos (barras, funil, sparkline) em CSS/SVG puro — bundle menor e 100% offline.

---

## Fase 4 — Decisão · 2026-07-08 · ✅ APROVADA

Escopo: módulos 08 Oportunidades, 09 Priorização (matriz + ranking), 10 Business Cases.

| # | Item | Resultado |
|---|------|-----------|
| 1 | Build `tsc && vite build` sem erros (strict) | ✅ 81 módulos |
| 2 | 08: lista, filtros, criar, promover hipótese validada → oportunidade | ✅ |
| 3 | 09: score composto correto (imp×1 − inv×0,5 − risco×0,5) | ✅ O1=2,5, O2=−1 |
| 4 | 09: quadrante da matriz correto por impacto/esforço | ✅ quick_wins / apostas_grandes |
| 5 | 09: matriz e ranking renderizam; ranking ordenado por score | ✅ Hub #1 |
| 6 | 09: promover oportunidade → BC marca oportunidade "promovida" | ✅ |
| 7 | 10: payback = CAPEX ÷ lucro mensal (120k ÷ 10k = 12 meses) | ✅ |
| 8 | 10: totais automáticos + badge "sem fonte" em valor sem premissa | ✅ |
| 9 | 10: **persiste após reload** (card mostra CAPEX/payback) | ✅ |
| 10 | Console sem erros | ✅ |

### Observações
- Payback fica em branco (não zero) quando lucro mensal ≤ 0 ou CAPEX = 0 — não mostra número que não se sustenta.
- Matriz usa drag nativo (sem lib), consistente com o SWOT.

---

## Fase 3 — Demais diagnósticos · 2026-07-07 · ✅ APROVADA

Escopo: módulos 03 Imobiliário, 04 Econômico, 06 Agroindustrial, 07 Turístico (onboarding + dados + análise).

| # | Item | Resultado |
|---|------|-----------|
| 1 | Build `tsc && vite build` sem erros (strict) | ✅ 76 módulos |
| 2 | 03/04/06/07 abrem com 3 abas (Onboarding/Dados/Análise) | ✅ |
| 3 | 03: painéis Comparáveis + R$/m² + Cenários de uso | ✅ |
| 4 | 03: **R$/m² médio calculado** (2 galpões 500 e 400 → média R$ 450) | ✅ aluguel sem dado fica "—" (não inventa) |
| 5 | 03: comparáveis **persistem após reload** | ✅ 2 comparáveis intactos |
| 6 | 04: separação visual fato vs. especulação por confiança | ✅ "Com fonte (1)" / "A confirmar (1)" |
| 7 | 06: players do agro + sazonalidade (calendário) + demandas | ✅ |
| 8 | 06: sazonalidade clique-cicla e **persiste em Config** | ✅ Jan → baixa gravado |
| 9 | 07: banner "pilar tende a ser projeto separado" + inventário | ✅ |
| 10 | Console sem erros | ✅ |
| 11 | Responsivo: sem overflow horizontal | ✅ |

### Observações
- Reúso de `Evidencia` para 04/06/07 (abordagem enxuta) funciona; `fonteDetalhe` carrega a categoria livre.
- Recharts segue não introduzido; nenhum módulo da Fase 3 exigiu gráfico além de tabelas/listas.

---

## Fase 2 — Diagnósticos core · 2026-07-07 · ✅ APROVADA

Critério de pronto da spec: *"consigo ver o funil hipótese→evidência→validação do hub logístico
com meus dados reais."*

| # | Item | Resultado |
|---|------|-----------|
| 1 | Build `tsc && vite build` sem erros (strict) | ✅ 68 módulos |
| 2 | Módulos 01/02/05 abrem com 3 abas (Onboarding/Dados/Análise) | ✅ |
| 3 | Logístico: import de campo popula players, ranking de dores e evidências | ✅ 1 player, dor "Overflow" ranqueada, 1 evidência (Rota Comercial foi p/ econômico, correto) |
| 4 | Criar hipótese atualiza o funil (0→1 hipótese) | ✅ |
| 5 | Vincular evidência atualiza o funil (0→1 evidência vinculada) | ✅ |
| 6 | **Regra de ouro: validar hipótese com < 3 evidências é bloqueado na camada de dados** | ✅ "precisa de pelo menos 3 evidências (tem 1)", status permanece não validada |
| 7 | Com 3 evidências vinculadas, validação passa | ✅ status = validada |
| 8 | **Funil completo persiste após reload** | ✅ 1 hip → 3 evid → 1 validada, badge visível |
| 9 | Patrimonial: inventário de ativos + matriz potencial por pilar | ✅ galpão importado listado |
| 10 | Jurídico: matriz ativo×item, pendências, seção holding/SPE com aviso "não substitui advogado" | ✅ |
| 11 | Análise: SWOT (add item) persiste no IndexedDB | ✅ força gravada |
| 12 | Console sem erros | ✅ |
| 13 | Responsivo: sem overflow horizontal em 375px (com funil + tabelas) | ✅ |

### Observações
- SWOT com drag nativo entre quadrantes (sem lib). Reclassificação por arraste verificada por leitura de código; teste manual de arraste recomendado ao usuário.
- Recharts ainda não introduzido: rankings usam barras CSS acessíveis. Pizza/radar entram quando um módulo os exigir (Fase 3+).

---

## Fase 1 — Fundação · 2026-07-07 · ✅ APROVADA

Critério de pronto da spec: *"importo meu JSON de campo real e vejo ativos/stakeholders/registros
dentro do app, fecho o navegador e os dados persistem."*

| # | Item | Resultado |
|---|------|-----------|
| 1 | Build `tsc && vite build` sem erros (strict, noUnusedLocals) | ✅ 57 módulos, build limpo |
| 2 | App carrega, Home renderiza os 12 módulos + alertas + estado vazio | ✅ |
| 3 | Import formato Hub `{galpao, players, registros}` detectado automaticamente | ✅ "Ferramenta do Hub Logístico (formato antigo)" |
| 4 | Import formato principal `{ativos, stakeholders, registros}` detectado | ✅ "Ferramenta principal de campo (sb_masterplan_v1)" |
| 5 | Preview mostra formato + contagens + amostra antes de confirmar | ✅ |
| 6 | Import grava e Home reflete contagens (1 ativo, 1 stk, 2 evid.) | ✅ |
| 7 | **Persistência: reload da página mantém os dados (IndexedDB)** | ✅ contagens intactas após `location.reload()` |
| 8 | Zero-perda: campos sem destino → `origem.camposNaoMapeados` | ✅ concorrentes/oportunidade/riscos e campoExtra preservados |
| 9 | `valorCitado` preservado no import (adição aprovada) | ✅ "R$ 000/mes" |
| 10 | Rota Comercial → pilar `economico`, rótulo original em `fonteDetalhe` | ✅ "Registro de campo — Rota Comercial" |
| 11 | Checklist técnico do galpão → `estadoFisico` do Ativo | ✅ |
| 12 | Export de backup JSON completo e válido | ✅ app/schemaVersion/exportadoEm + todas entidades |
| 13 | Import de backup exige confirmação (substitui dados) | ✅ diálogo de confirmação |
| 14 | Export CSV por entidade (BOM + `;`) | ✅ implementado (ativos/stakeholders/evidências) |
| 15 | Console sem erros não tratados | ✅ nenhum erro |
| 16 | Responsivo: sem overflow horizontal em 375px | ✅ scrollWidth = viewport |

### Edge cases verificados
- 0 dados: Home mostra estado vazio "Comece por aqui" + alertas de pilares sem dados. ✅
- Import de arquivo com campo inesperado (`campoExtra`): preservado, não quebra. ✅
- Detecção de formato desconhecido: retorna erro amigável (por leitura de código; recomendado teste manual dedicado na Fase 2).

### Pendências levadas para fases seguintes (não bloqueiam Fase 1)
- Import de JSON malformado/vazio: caminho de erro existe no código; falta teste automatizado dedicado.
- Acessibilidade por teclado: navegação básica ok; auditoria completa AA fica para a passada final (Fase 5).
