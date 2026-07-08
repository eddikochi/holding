---
name: masterplan-domain
description: Resumo do domínio do Masterplan São Borja — os 13 módulos, os 8 pilares, as 9 entidades do modelo de dados, a regra hipótese≠evidência≠decisão e os formatos de import da ferramenta de campo. Consultar antes de implementar qualquer módulo, texto ou migração de dados.
---

# Domínio — Masterplan São Borja

Fonte de verdade completa: `SPEC.md` na raiz. Este resumo existe para consulta rápida; em conflito, a spec vence.

## O projeto em uma frase

Transformar os ativos físicos da família em São Borja/RS (galpão, terrenos, loja, oficina) em um ecossistema de oportunidades de negócio, **validando hipóteses antes de investir**. O Hub Logístico é a tese mais madura, mas é UM dos pilares, não a resposta pronta.

## Metodologia (ordem importa)

diagnóstico → discovery → validação de hipóteses → priorização → business cases → roadmap

## Os 13 módulos

01 Diagnóstico Patrimonial · 02 Jurídico · 03 Imobiliário · 04 Econômico · 05 Logístico (o mais maduro — absorve a ferramenta de campo do hub) · 06 Agroindustrial · 07 Turístico (tende a ser projeto separado; não misturar na priorização por default) · 08 Educação / Economia Estudantil · 09 Oportunidades · 10 Priorização · 11 Business Cases · 12 Roadmap · 13 Governança Familiar (inclui Decision Log e KPIs).

## Os 8 pilares (enum `Pilar`)

`patrimonial | juridico | imobiliario | economico | logistico | agroindustrial | turistico | educacao`

`educacao` (Educação / Economia Estudantil) foi adicionado depois: São Borja é cidade universitária
(Unipampa, UERGS, IFFar, privadas e EAD). Cruza com econômico e imobiliário. Diagnósticos vão de 01 a 08;
decisão/execução de 09 a 13 (13 módulos no total).

## As 9 entidades (todas com id, createdAt, updatedAt)

1. **Ativo** — imóvel/bem físico; inclui checklist jurídico embutido (matrícula, inventário, sucessão, zoneamento, licenciamento, ambiental, tributação, contratos, holding/SPE).
2. **Stakeholder** — pessoa/empresa mapeada; pode vincular a ativo e a hipótese.
3. **Evidência** — fato coletado (entrevista, observação de campo, pesquisa desk, dado oficial) com grau de confiança alto/médio/baixo; vincula a ativo, stakeholder e/ou hipótese.
4. **Hipótese** — enunciado testável por pilar; status: não validada / parcial / validada / refutada.
5. **Oportunidade** — candidata a negócio; notas 1–5 de impacto, investimento, risco, esforço.
6. **Business Case** — aprofundamento de oportunidade priorizada (CAPEX/OPEX, receitas, payback, cenários, decisão go/no-go/aguardar).
7. **Decisão** (Decision Log) — o que foi decidido, quando, por quem, por quê, reversível ou não, embasada em quais hipóteses/evidências.
8. **Tarefa/Marco** — roadmap por horizonte: 0-12m / 1-3a / 3-5a / 5-10a, com dependências.
9. **KPI** — indicador com alvo, valor atual e histórico de medições.

## Regra de ouro (inegociável)

**Hipótese ≠ evidência ≠ decisão.** Entidades separadas, badges/cores distintas na UI, vínculos por ID. Hipótese só vira "validada" com ≥ N evidências vinculadas (config, default 3). Número sem fonte tem badge de alerta. Incerteza nunca é escondida.

## Import da ferramenta de campo

- Formato da spec: `{ativos:[], stakeholders:[], registros:[]}` (chave localStorage `sb_masterplan_v1`).
- Formatos legados existentes nesta pasta (ferramenta `SAO_BORJA_CAMPO_DASHBOARD.html`): `{galpao:{}, players:[], registros:[], entrevistas:[]}` (chave `sb_campo_data_v2`) e anteriores.
- Regra: import nunca perde dado — campo sem destino vai para observações da entidade; preview antes de confirmar; transacional.

## Proibições da spec

Sem backend/login/nuvem/tracking · sem dados de exemplo realistas · sem libs pesadas de Gantt/kanban · interface em PT-BR · local-first com IndexedDB.
