# Design Tokens — Masterplan São Borja

> Fonte única de estilo: `app/src/styles/tokens.css` (CSS custom properties).
> Toda cor, tipografia, raio, espaçamento e alvo de toque vem daqui. Nenhum componente
> deve ter valor de estilo hardcoded fora destes tokens.
>
> **Preparação para a identidade visual da holding:** quando a identidade ficar pronta,
> trocar a aparência do app = editar este arquivo de tokens. Não é preciso caçar estilo no código.

## Como usar

- Em CSS (`global.css`): `background: var(--panel); color: var(--ink);`
- Em estilo inline React: `style={{ color: 'var(--ink-soft)' }}`
- Em JS que exige string de cor real (ex.: Leaflet): ler em runtime com
  `getComputedStyle(document.documentElement).getPropertyValue('--blue')` — assim continua
  vindo do token. Ver `AtivosMapa.tsx`.

## Tokens

### Cores neutras
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | #f7f7f4 | fundo geral |
| `--panel` | #ffffff | cartões e painéis |
| `--ink` | #1b1b1a | texto principal |
| `--ink-soft` | #5b5b57 | texto secundário |
| `--line` | #dcdad2 | bordas e divisores |
| `--white` | #ffffff | texto/ícone sobre superfícies escuras |
| `--bg-hover` | #faf9f6 | hover de linha de tabela |
| `--track` | #edece7 | trilho de barras (progresso/ranking) |
| `--neutral-soft` | #f0f0ec | fundo de badge/estado neutro |

### Famílias de ação (uma cor por família, não por pilar)
| Token | Valor | Família |
|-------|-------|---------|
| `--blue` / `--blue-soft` / `--blue-border` | #1e3a5f / #eaf0f6 / #cddcec | ação primária / navegação / hipótese |
| `--amber` / `--amber-soft` | #c0762a / #fbf0e2 | atenção / incerteza / pendência |
| `--green` / `--green-soft` | #3b6e4e / #eaf3ec | confirmação / validado |
| `--red` / `--red-soft` | #9c3b2e / #f7eae7 | perigo / refutado / destrutivo |

### Semântica fixa (regra hipótese≠evidência≠decisão)
- Hipótese: azul (`--blue`/`--blue-soft`), nunca verde antes de validada.
- Evidência: confiança alta=`--green`, média=`--amber`, baixa=`--red`.
- Decisão: fundo `--ink`, texto `--white`.
- Número sem fonte / pendência: `--amber`.

### Tipografia
| Token | Valor |
|-------|-------|
| `--font` | system-ui stack (`-apple-system, "Segoe UI", Roboto…`) |
| `--fs-corpo` / `--fs-sec` / `--fs-mini` | 15px / 12.5px / 11px |
| `--fs-h1` / `--fs-h2` / `--fs-h3` | 20px / 16px / 14px |
| `--fs-num` | 22px (números de destaque) |
| `--lh` | 1.45 |

### Espaçamento (escala de 4px)
`--s1`=4 · `--s2`=8 · `--s3`=12 · `--s4`=16 · `--s6`=24 · `--s8`=32

### Forma e foco
`--r-input`=7px · `--r-panel`=10px · `--r-pill`=20px · `--toque-min`=40px · `--foco`=2px solid azul

### Identidade Kochi Holding (logo + ações de tabela)
| Token | Valor | Uso |
|-------|-------|-----|
| `--logo-bg` | #171c26 | fundo escuro da área do logo |
| `--logo-mark` | #20d9a3 | marca "K" (teal) |
| `--logo-nome` | #ffffff | "Kochi" |
| `--logo-holding` | #a0a9b8 | "HOLDING" |
| `--acao-editar` | #20d9a3 | botão "Editar" em tabela (teal) |
| `--acao-x` | #ef4444 | botão "×"/remover em tabela (vermelho vazado) |

> Aplicados no logo da sidebar (`.brand`/`.logo-*` em global.css) e nos botões de ação dentro de `td`.
> São o começo da identidade da holding; ao consolidar a identidade completa, ajustar por aqui.

## Verificação
Trocar uma cor no `tokens.css` (ex.: `--blue`) muda navegação, botões primários, badges de hipótese,
matriz e marcadores do mapa em todo o app — sem editar componentes.
