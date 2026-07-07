# QA Checklist — Masterplan São Borja

> Dono: agente **qa-reviewer**. Uma seção por fase. Testes feitos no navegador real (preview), não por leitura de código.

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
