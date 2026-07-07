---
name: design-tokens
description: Tokens do design system do Masterplan São Borja — cores, espaçamentos, tipografia e semântica de badges (hipótese/evidência/decisão, confiança, status). Referência única para qualquer trabalho de UI. Consultar antes de estilizar qualquer componente ou tela.
---

# Design tokens — Masterplan São Borja

Implementação canônica: `src/styles/tokens.css` (CSS custom properties). Este documento define os valores; o CSS os materializa. Mudança de token = mudar aqui E no tokens.css.

## Princípio

Paleta neutra e sóbria, uma cor de destaque por **família de ação** (não uma cor por pilar). Tipografia de sistema. Nada decorativo. Contraste AA mínimo.

## Cores

### Neutros (base da interface)
- `--bg: #F7F7F4` — fundo geral
- `--panel: #FFFFFF` — cartões e painéis
- `--ink: #1B1B1A` — texto principal
- `--ink-soft: #5B5B57` — texto secundário
- `--line: #DCDAD2` — bordas e divisores

### Famílias de ação (destaque)
- **Ação primária / navegação**: `--blue: #1E3A5F` · fundo suave `--blue-soft: #EAF0F6`
- **Atenção / incerteza / pendência**: `--amber: #C0762A` · fundo suave `--amber-soft: #FBF0E2`
- **Confirmação / validado**: `--green: #3B6E4E` · fundo suave `--green-soft: #EAF3EC`
- **Perigo / refutado / destrutivo**: `--red: #9C3B2E` · fundo suave `--red-soft: #F7EAE7`

## Semântica fixa de badges (regra de ouro visível)

- **Hipótese**: contorno azul, fundo `--blue-soft` — nunca verde enquanto não validada.
- **Evidência**: fundo neutro com indicador de confiança — alta `--green`, média `--amber`, baixa `--red` (borda esquerda).
- **Decisão**: fundo `--ink`, texto claro — peso visual de registro definitivo.
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
