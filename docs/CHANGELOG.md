# Changelog — Masterplan São Borja

Formato: cada fase da spec vira uma entrada. Datas em ISO.

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
