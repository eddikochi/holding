# Como o progresso de cada módulo é calculado (Home)

Objetivo: o número de "% preenchido" de cada card na Visão geral tem que ser **explicável** — ao ver
"50%", dá para saber de onde vem. Implementação: `sinaisDadosDiagnostico` e `progressoDiagnostico` em
`app/src/lib/calc/progresso.ts`; consumo em `app/src/features/home/Home.tsx` (função `progresso`).

## Diagnósticos (módulos 01–08)

Progresso = **média 50/50 de dois componentes**:

```
progresso = arredondar( (Dados% + Checklist%) / 2 )
```

- **Dados%** = % dos *tipos de dado que o módulo usa* que já têm ao menos um registro. Cada tipo vale
  uma fatia igual. Um módulo **não é penalizado** por não ter uma entidade que ele nem usa.
- **Checklist%** = % de itens do checklist de discovery marcados (aba Onboarding do módulo).

Tipos de dado contados em "Dados%" por módulo:

| Módulo | Sinais de "Dados" (cada um vale uma fatia) |
|---|---|
| 01 Patrimonial | tem ≥1 ativo |
| 02 Jurídico | tem ≥1 ativo com item jurídico avaliado (status ≠ não iniciado) |
| 03 Imobiliário | tem ≥1 comparável · tem ≥1 ativo com cenário de uso |
| 04 Econômico | tem ≥1 evidência (do pilar) |
| 05 Logístico | tem ≥1 player · tem ≥1 evidência · tem ≥1 hipótese |
| 06 Agroindustrial | tem ≥1 player · tem ≥1 evidência · sazonalidade preenchida |
| 07 Turístico | tem ≥1 evidência |
| 08 Educação | tem ≥1 player · tem ≥1 evidência · tem ≥1 hipótese |

### Exemplos
- Logístico com players + evidências + hipóteses, checklist zerado → Dados 100%, Checklist 0% → **50%**.
- O mesmo Logístico com todo o checklist marcado → **100%**.
- Agroindustrial com player + evidência, sem sazonalidade, checklist zerado → Dados 2/3 = 67%, Checklist 0% → **33%**.
- Imobiliário sem comparáveis nem cenários, checklist zerado → **0%**.

## Decisão e execução (módulos 09–13)

Não têm checklist de discovery; o progresso é por **presença dos dados-chave** (fração de sinais presentes):

| Módulo | Sinais |
|---|---|
| 09 Oportunidades | tem ≥1 oportunidade |
| 10 Priorização | tem ≥1 oportunidade com impacto e esforço definidos |
| 11 Business Cases | tem ≥1 business case |
| 12 Roadmap | tem ≥1 tarefa/marco |
| 13 Governança | tem ≥1 decisão · tem ≥1 KPI |

## Notas
- O cálculo é reativo: muda ao vivo quando você adiciona dados ou marca itens do checklist.
- Ajustar o peso (ex.: 70% dados / 30% checklist) é uma linha em `progressoDiagnostico`.
