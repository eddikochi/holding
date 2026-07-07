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
