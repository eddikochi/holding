# Changelog — Masterplan São Borja

Formato: cada fase da spec vira uma entrada. Datas em ISO.

## Fase 3 — Demais diagnósticos — 2026-07-07

Módulos 03 Imobiliário, 04 Econômico, 06 Agroindustrial e 07 Turístico completos
(onboarding + dados + análise). Todos os 7 diagnósticos agora têm tela real.

### Adicionado
- **Schema v3**: entidade `ComparavelImobiliario` (store `comparaveis`), campo `Ativo.cenariosUso`,
  tipos de sazonalidade (em `Config`). Migração aditiva; incluído em backup.
- **Módulo 03 Imobiliário**: comparáveis de mercado (CRUD), **cálculo automático de R$/m² médio por tipo**
  (só com dado real; sem dado fica em branco), cenários de uso por ativo (alugar/retrofit/desenvolver/vender).
- **Módulo 04 Econômico**: registro de dados com fonte obrigatória, **separação visual fato vs. especulação**
  (por grau de confiança), cobrindo demografia, incentivos e corredor bioceânico.
- **Módulo 06 Agroindustrial**: players do agro, **calendário de sazonalidade** anual e demandas/parcerias.
- **Módulo 07 Turístico**: inventário de atrativos/ideias com marcação visual de que **é projeto separado**
  (não entra na priorização por default).
- **Componentes reutilizáveis**: `EvidenciasPanel` (com split fato/especulação), `StakeholdersPanel`,
  `SazonalidadeEditor`.
- **Abordagem enxuta** (aprovada): 04/06/07 reúsam `Evidencia`; só 03 exigiu entidade nova.

### Verificado (ver docs/QA_CHECKLIST.md)
- R$/m² calculado corretamente e persistente; split fato/especulação; sazonalidade persistida; sem erros no console.

## Fase 2 — Diagnósticos core — 2026-07-07

Módulos 01 Patrimonial, 02 Jurídico e 05 Logístico completos (os que já têm dados reais),
cada um com as 3 abas da spec: Onboarding · Dados · Análise.

### Adicionado
- **Schema v2**: entidade `AnalisePilar` (SWOT + leitura executiva + recomendações), store `analises`,
  migração aditiva. Incluída em backup/restore.
- **CRUD na camada de dados** (`src/db/actions.ts`) para ativo, stakeholder, hipótese, evidência e análise.
- **Regra de ouro enforçada nos dados**: hipótese só vai a "validada" com ≥ N evidências vinculadas
  (default 3) — bloqueio em `salvarHipotese`, não só na UI.
- **Módulo 05 Logístico** com o **funil hipótese → evidência → validação → business case**
  (critério de pronto da fase), ranking de dores, players logísticos, evidências com vínculo a hipótese,
  e resumo do galpão.
- **Módulo 01 Patrimonial**: inventário de ativos (CRUD com ficha completa), matriz de potencial por pilar,
  lista de coordenadas (mapa Leaflet fica para a Fase 5).
- **Módulo 02 Jurídico**: matriz ativo × item jurídico colorida e clicável, lista de pendências
  com responsável/prazo, seção Holding/SPE (prós, contras, anotações) com aviso de que não substitui advogado.
- **Componentes**: `Tabs`, `SwotEditor` (drag nativo), `DiagnosticoLayout`, `AnaliseTab`, `ModuloDispatcher`.

### Verificado (ver docs/QA_CHECKLIST.md)
- Funil com dados reais: criar hipótese → vincular evidências → validação bloqueada com <3 e liberada com 3 →
  **persiste após reload**. Build limpo, console sem erros, sem overflow em mobile.

### Decisão de escopo
- Recharts adiado: rankings em barras CSS acessíveis por ora; gráficos pizza/radar entram quando um módulo os exigir.

## Fase 1 — Fundação — 2026-07-07

Primeira fundação funcional do app web local-first.

### Adicionado
- **Setup do projeto** em `/app`: React 18 + Vite 5 + TypeScript (strict), sem backend.
- **Modelo de dados completo** — as 9 entidades da spec em `src/models/types.ts`
  (Ativo, Stakeholder, Evidência, Hipótese, Oportunidade, Business Case, Decisão, Tarefa, KPI).
  - Adição aprovada: `Stakeholder.valorCitado`.
  - Apoio à zero-perda: `Evidencia.fonteDetalhe` e `OrigemImportacao.camposNaoMapeados`.
- **Persistência IndexedDB** via Dexie (`src/db/database.ts`, `repository.ts`), schema v1.
- **Import da ferramenta de campo** com **detecção automática de formato** (`src/db/importCampo.ts`):
  - Formato principal `sb_masterplan_v1` `{ativos, stakeholders, registros}`.
  - Formato legado do Hub `{galpao, players, registros}` → tudo no pilar Logística.
  - Preview (formato + contagens + amostra) antes de confirmar; import transacional; **zero perda de dados**.
- **Backup**: export/import JSON completo (com confirmação) + export CSV por entidade (BOM UTF-8, `;`).
- **Home / Visão Geral**: progresso dos 12 módulos, alertas automáticos, KPIs, acessos rápidos.
- **Navegação entre os 12 módulos**, cada um com **onboarding real** (o "porquê") e estado vazio
  explicando que dados/análise chegam nas próximas fases.
- **Design system** (tokens + componentes: PageHeader, EmptyState, Badges, Toast) e responsividade.
- **Time de agentes** (`.claude/agents/`) e skills (`.claude/skills/`): architect, ui-builder,
  data-logic, content-writer, qa-reviewer + masterplan-domain, design-tokens.
- **Docs**: DATA_MODEL, COMPONENTS, QA_CHECKLIST.

### Verificado (ver docs/QA_CHECKLIST.md)
- Critério de pronto da Fase 1 atingido: import de JSON de campo → dados visíveis → reload → **persistem via IndexedDB**. Backup JSON funcionando. Build limpo, console sem erros, sem overflow em mobile.

### Ainda não implementado (fases seguintes)
- Formulários/tabelas e análise (SWOT + leitura executiva) de cada módulo (Fases 2–3).
- Oportunidades, Priorização, Business Cases (Fase 4).
- Roadmap, Governança, Decision Log, KPIs, mapa Leaflet (Fase 5).
