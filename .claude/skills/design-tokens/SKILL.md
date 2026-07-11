---
name: design-tokens
description: Tokens do design system do Masterplan São Borja — cores, espaçamentos, tipografia e semântica de badges (hipótese/evidência/decisão, confiança, status). Referência única para qualquer trabalho de UI. Consultar antes de estilizar qualquer componente ou tela.
---

# Design tokens — Masterplan São Borja

Implementação canônica: `src/styles/tokens.css` (CSS custom properties). Este documento define os valores; o CSS os materializa. Mudança de token = mudar aqui E no tokens.css.

## Princípio

Tema **escuro**, paleta neutra e sóbria, uma cor de destaque por **família de ação** (não uma cor por pilar). Tipografia de sistema. Nada decorativo. Contraste AA mínimo. Branco sempre suave (`#F2F4F5`), nunca `#FFFFFF` puro.

## Cores

### Tokens canônicos (fonte única de verdade, em `:root`)
Toda a paleta deriva destes. Os nomes semânticos abaixo (`--bg`, `--panel`, …) são **aliases** destes; trocar a paleta = mudar aqui.
- `--color-bg: #0E1015` · `--color-surface: #151828` · `--color-surface-elevated: #1B212B`
- `--color-border: #283230` · `--color-text-primary: #F2F4F5` · `--color-text-secondary: #A0A9B8`
- `--color-accent: #5DA790` (teal — accent/ação primária) · `--color-warning: #F59E0B` · `--color-error: #EF4444`

### Neutros (aliases — base da interface, tema escuro)
- `--bg` → fundo geral · `--panel` → superfície de cartões/painéis · `--panel-2` → superfície elevada
- `--ink` → texto primário · `--ink-soft` → texto secundário · `--line` → bordas e divisores

### Famílias de ação (destaque — ajustadas para fundo escuro)
- **Ação primária (botões)**: `--color-accent: #5DA790` (teal) com texto escuro `--color-bg`. Botões de ação usam teal, não azul.
- **Navegação / hipótese**: `--blue: #5B8FC9` · fundo suave `--blue-soft: #1A2740` · borda `--blue-border: #33517A`
- **Atenção / warning / pendência**: `--amber: #F59E0B` · fundo suave `--amber-soft: #362A12`
- **Confirmação / validado**: `--green: #57C98A` · fundo suave `--green-soft: #163224`
- **Perigo / refutado / erro / destrutivo**: `--red: #EF4444` · fundo suave `--red-soft: #3A1C1C`

### Identidade Kochi Holding
- `--logo-mark: #20D9A3` — teal vibrante da marca (o "K" do logo)
- `--acao-editar: #5DA790` — accent teal do Design System (ex.: botão Editar em tabela)
- Teal como **texto/ícone/borda** sobre fundo escuro passa AA (~6.7:1). Como **fundo de botão**, usar texto escuro (`--bg`), nunca texto claro — texto claro sobre teal falha AA.

## Semântica fixa de badges (regra de ouro visível)

- **Hipótese**: contorno azul, fundo `--blue-soft` — nunca verde enquanto não validada.
- **Evidência**: fundo neutro com indicador de confiança — alta `--green`, média `--amber`, baixa `--red` (borda esquerda).
- **Decisão**: fundo `--ink` (claro), texto escuro `--bg` — peso visual de registro definitivo.
- **Status de hipótese**: não validada = neutro; parcial = âmbar; validada = verde; refutada = vermelho.
- **Número sem fonte**: badge âmbar "sem fonte".

## Tipografia

- Família: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`
- Corpo: 15px / 1.45 · Secundário e labels: 12.5px · H1 página: 20px · H2 seção: 16px · Dado numérico de destaque: 22px/800
- Pesos: 400 corpo, 600 labels e botões, 700–800 números e títulos.

## Espaçamento e forma

- Escala de 4px: 4 / 8 / 12 / 16 / 24 / 32.
- Raio: 7px inputs e botões · 10px painéis · 20px pills/badges.
- Container principal: max-width 1100px, padding 16px.
- Alvo de toque mínimo: 40px de altura em botões e inputs.

## Estados

- Foco visível: outline 2px `--blue` com offset 2px (nunca remover sem substituto).
- Desabilitado: opacidade .5 + cursor not-allowed.
- Vazio: texto `--ink-soft`, centrado no painel, sempre com instrução de próximo passo.
