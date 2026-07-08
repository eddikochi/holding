# Changelog — Masterplan São Borja

Formato: cada fase da spec vira uma entrada. Datas em ISO.

## Fase corretiva final — 5 itens de estrutura — 2026-07-08

Última fase de estrutura antes de identidade visual e preenchimento de dados. Escopo travado nos 5 itens.

### Item 1 — 8º pilar: Educação / Economia Estudantil
- Novo pilar `educacao` em todo o código (types, PILARES, contarPorPilar, validadores de import, modulos).
  Entra como **diagnóstico módulo 08**; decisão/execução renumerados para **09–13** (13 módulos; slugs de rota
  inalterados). Aparece na navegação, Home (progresso), priorização e business cases (oportunidades são multi-pilar).
- Onboarding real (Unipampa, UERGS, IFFar, privadas/EAD; fluxo transfronteiriço tratado como hipótese a validar).
  5 hipóteses iniciais sugeridas adicionáveis com um clique na aba Discovery.
- **Nota:** o kickoff dizia "7º pilar (de 6 para 7)", mas o app já tinha 7 — este é o 8º. Reportado.

### Itens 2, 3, 4 — Discovery guiado por pilar (`content/discovery.ts`)
- **Item 4** — "O que estamos tentando descobrir": perguntas-mestre do pilar, primeiro bloco do onboarding.
- **Item 3** — "Quem procurar em campo": tabela de tipos de player + o que investigar em cada um; o mesmo
  vira a lista sugerida de tipo ao cadastrar um stakeholder (+ "Outro" livre).
- **Item 2** — Roteiro de entrevista por pilar mostrado no modal de registro do stakeholder; cada resposta
  preenchida vira uma **evidência** (fonte entrevista) vinculada à hipótese escolhida.
- Logística usa as perguntas/tipos/roteiro do material de Discovery do projeto; demais pilares têm equivalentes.
- StakeholderModal unificado (`StakeholdersPanel`), reusado por todos os pilares com players.

### Item 5 — Design tokens consolidados
- Todas as cores/tipografia/raios/espaçamentos centralizados em `tokens.css`; `global.css` e componentes só
  usam `var(--…)`. O mapa Leaflet lê as cores via `getComputedStyle` (também via token).
- Sem mudança de aparência. Documentado em **docs/DESIGN_TOKENS.md**. Trocar `--blue` reflete em todo o app.

### Verificado (qa-reviewer) e limpeza
- Os 5 critérios de pronto passaram no navegador; sem regressão; build strict e console limpos.

## Fase corretiva — auditoria dos 3 itens — 2026-07-08

Correção de 3 itens da SPEC.md que a auditoria apontou como ausentes/superficiais. Escopo travado.

### Item 1 — Painel de Discovery por pilar
- Nova aba **Discovery** em todos os diagnósticos (01–07): funil visual (hipóteses → com evidência →
  parciais → validadas → refutadas), hipótese expansível mostrando TODAS as evidências e as entrevistas
  (nome, data, dor, valorCitado), vínculo de evidências e botão de validar **desabilitado com tooltip**
  até atingir o mínimo de evidências.
- **Import do Hub agora alimenta o funil ponta a ponta**: cada player vira contato + evidência de
  entrevista, vinculados à hipótese do Hub que ele sustenta (id de hipótese estável, sem duplicar em re-import).
- Funil saiu da aba "Dados" do Logístico (evita duplicação); Dados agora foca em players/dores/evidências.

### Item 2 — Onboarding didático (01–07)
- Aba Onboarding reescrita com conteúdo real: o que responde, por que antes de investir, **coleta CAMPO
  (presencial) vs DESK (Porto Alegre)** separadas visualmente, **checklist de discovery com progresso
  persistido**, e critério de "pronto" em lista.
- Onboarding abre na **primeira visita** ao módulo; depois abre em Dados, com botão **"?"** no cabeçalho.

### Item 3 — Preview de import + Home
- Import (ambos os formatos) mostra **preview com criados vs. atualizados** por entidade e opção
  **mesclar ou substituir**; nada é gravado antes da confirmação.
- Home: **% de preenchimento dos 12 módulos** e os **4 alertas automáticos** (pilar sem dados, hipótese
  sem evidência, pendência jurídica, número sem fonte em business case).

### Verificado (qa-reviewer, ver QA_CHECKLIST)
- Os 4 critérios de pronto passaram no navegador; sem regressão; build strict e console limpos.
- Limpeza: removido `ModuloShell` (código morto). `Tabs` agora suporta modo controlado.

## Fase 5 — Execução e governança — 2026-07-08

Últimos dois módulos + mapa + polimento. **Os 12 módulos do Masterplan estão completos.**

### Adicionado
- **Módulo 11 Roadmap**: tarefas/marcos em **colunas por horizonte** (0-12m / 1-3a / 3-5a / 5-10a),
  com pilar, business case relacionado e **dependências "bloqueado por"** visíveis. Sem lib de kanban.
- **Módulo 12 Governança Familiar** (3 abas):
  - Papéis familiares, modelo decisório e ritos (reuniões), salvos em Config.
  - **Decision Log** filtrável — cada decisão com motivo, quem decidiu, reversibilidade e vínculos a
    hipóteses/evidências.
  - **KPIs** com histórico de medições e **mini-gráfico de evolução (sparkline SVG)**.
- **Mapa Leaflet** no módulo 01 (OpenStreetMap), plotando ativos com lat/lng via `circleMarker`
  (sem imagens externas, funciona no HTML single-file). **Degrada para lista** quando offline.
- **Home**: barra de progresso agora cobre os 12 módulos (08–12 marcam "com dados"/"vazio").
- Componente `Sparkline` (SVG puro). Nova dependência: `leaflet`.

### Verificado (ver docs/QA_CHECKLIST.md — passada final)
- Roadmap com dependências; Decision Log; KPI com sparkline; mapa Leaflet (12 tiles + marcador);
  responsivo; console limpo. Todos os 12 módulos revisados de ponta a ponta.

### Decisão de escopo mantida
- Recharts não foi necessário: barras (CSS), funil e sparkline (SVG) cobrem as visualizações, mantendo
  o bundle menor e o app 100% offline (exceto tiles do mapa).

## Fase 4 — Decisão — 2026-07-08

Módulos 08 Oportunidades, 09 Priorização e 10 Business Cases. Fecha o caminho
diagnóstico → discovery → validação → **priorização → business case → decisão**.

### Adicionado
- **Módulo 08 Oportunidades**: lista mestre com filtros (pilar/status), criação manual e
  **promoção a partir de hipóteses validadas**; notas 1–5 de impacto/investimento/risco/esforço,
  vínculo a pilares e hipóteses.
- **Módulo 09 Priorização**: **matriz Impacto × Esforço** com cards arrastáveis nos 4 quadrantes
  (quick wins / apostas grandes / preencher tempo / descartar), posição salva; **ranking por score
  composto** com pesos ajustáveis; botão "Promover a Business Case".
- **Módulo 10 Business Cases**: card por BC + editor por seções (resumo, modelo, premissas,
  CAPEX/OPEX/receitas, cenários, riscos, decisão go/no-go/aguardar). **Tabelas financeiras com totais
  automáticos**, campo fonte/premissa por número e **badge de alerta em número sem fonte**.
  **Payback simplificado** calculado (CAPEX ÷ lucro mensal), em branco quando não se sustenta.
- Cálculos puros: `lib/calc/priorizacao.ts` (score, quadrante) e `lib/calc/financeiro.ts` (totais, payback).
- `BusinessCase.oportunidadeId` agora opcional (BC promovido ou avulso). Pesos de priorização em Config.

### Verificado (ver docs/QA_CHECKLIST.md)
- Fluxo completo hipótese→oportunidade→priorização→BC; score e payback corretos; persistência; sem erros no console.

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
