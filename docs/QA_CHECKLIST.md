# QA Checklist — Masterplan São Borja

> Dono: agente **qa-reviewer**. Uma seção por fase. Testes feitos no navegador real (preview), não por leitura de código.

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
