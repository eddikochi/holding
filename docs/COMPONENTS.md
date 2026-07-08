# Componentes — Masterplan São Borja

> Dono: agente **ui-builder**. Reuso antes de criação: consulte esta lista antes de criar componente novo.
> Tokens visuais: `.claude/skills/design-tokens` → `app/src/styles/tokens.css`.

## Componentes de design system (Fase 1)

| Componente | Arquivo | Props | Quando usar |
|------------|---------|-------|-------------|
| `PageHeader` | `components/PageHeader.tsx` | `kicker?`, `titulo`, `descricao?`, `acoes?` | Topo de toda página. Título + kicker + ações à direita. |
| `EmptyState` | `components/EmptyState.tsx` | `titulo`, `children`, `acao?` | Toda tela/painel sem dados. Sempre diz o próximo passo. |
| `BadgeConfianca` | `components/Badge.tsx` | `confianca` | Evidência: alta/média/baixa visualmente distintas. |
| `BadgeStatusHipotese` | `components/Badge.tsx` | `status` | Status de hipótese — nunca verde antes de validada. |
| `BadgeHipotese` / `BadgeDecisao` | `components/Badge.tsx` | — | Marcar visualmente hipótese vs. decisão (regra de ouro). |
| `BadgeSemFonte` | `components/Badge.tsx` | — | Número sem fonte declarada. |
| `ToastProvider` / `useToast` | `components/Toast.tsx` | — | Feedback efêmero de ação (salvou, importou). |
| `Tabs` | `components/Tabs.tsx` | `abas`, `inicial?` | Abas acessíveis (role=tab). Base das 3 abas dos diagnósticos. |
| `SwotEditor` | `components/SwotEditor.tsx` | `valor`, `onChange` | SWOT: 4 quadrantes, itens add/remove + drag nativo entre quadrantes. |

## Componentes de módulo (Fase 2)

| Componente | Arquivo | Papel |
|------------|---------|-------|
| `DiagnosticoLayout` | `features/modulos/DiagnosticoLayout.tsx` | Casca de diagnóstico com as 3 abas fixas (Onboarding/Dados/Análise). |
| `OnboardingTab` | idem | Aba 1 didática, lê `content/onboarding.ts`. |
| `AnaliseTab` | `features/modulos/AnaliseTab.tsx` | Aba 3 compartilhada: SWOT + leitura executiva + recomendações. |
| `ModuloDispatcher` | `features/modulos/ModuloDispatcher.tsx` | Roteia 01/02/05 → layout completo; demais → shell placeholder. |
| `PatrimonialDados` / `JuridicoDados` / `LogisticoDados` | `features/modulos/*/` | Aba "Dados" de cada módulo da Fase 2. |
| `EvidenciasPanel` | `features/modulos/EvidenciasPanel.tsx` | Lista + CRUD de evidências de um pilar. Opção `separarFatoEspeculacao` agrupa por confiança. Reusado por 04/06/07. |
| `StakeholdersPanel` | `features/modulos/StakeholdersPanel.tsx` | Lista + CRUD de stakeholders de um pilar. Usado por 06. |
| `SazonalidadeEditor` | `features/modulos/agroindustrial/` | Calendário anual de intensidade (clique cicla), salvo em Config. |
| `ImobiliarioDados` / `EconomicoDados` / `AgroindustrialDados` / `TuristicoDados` | `features/modulos/*/` | Aba "Dados" dos módulos da Fase 3. |
| `OportunidadesView` / `PriorizacaoView` / `BusinessCasesView` | `features/modulos/*/` | Módulos 08–10 (Fase 4), telas próprias sem 3 abas. |
| `RoadmapView` / `GovernancaView` | `features/modulos/*/` | Módulos 11–12 (Fase 5). Governança usa `Tabs` (Papéis/Decision Log/KPIs). |
| `Sparkline` | `components/Sparkline.tsx` | Mini-gráfico de linha em SVG puro (evolução de KPIs). |
| `AtivosMapa` | `features/modulos/patrimonial/AtivosMapa.tsx` | Mapa Leaflet dos ativos; degrada para lista offline. |

## Classes utilitárias (em `styles/global.css`)

- Layout: `.app-shell`, `.sidebar`, `.content`, `.nav-link`, `.nav-sep`
- Contêiner: `.panel`, `.page-header`
- Botões: `.btn`, `.btn.secondary`, `.btn.ghost`, `.btn.danger`, `.btn.small`
- Dados: `table`, `.badge.*`, `.kpi-row`/`.kpi-box`, `.prog-track`/`.prog-fill`
- Feedback: `.alerta`, `.alerta.ok`, `.empty-state`, `.toast`
- Módulos: `.grid-modulos`, `.modulo-card`

## Regras

- Foco visível (`:focus-visible` com outline azul) nunca removido sem substituto.
- Alvo de toque mínimo 40px em botões/inputs.
- Responsivo: sidebar vira topo abaixo de 780px; sem overflow horizontal em 375px (verificado).
