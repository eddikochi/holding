# Modelo de Dados — Masterplan São Borja

> Dono: agente **architect**. Toda mudança de schema passa por ele e é registrada aqui.
> Implementação canônica: `app/src/models/types.ts` · stores em `app/src/db/database.ts`.

## Versão de schema

- **Schema atual: v3** (`SCHEMA_VERSION = 3` em `database.ts`).
- v1 → v2: migração aditiva (nova store `analises`).
- v2 → v3: migração aditiva (nova store `comparaveis`); campo opcional `cenariosUso` no Ativo (não indexado, sem migração).

## Convenções

- Toda entidade estende `BaseEntity`: `id` (string, `crypto.randomUUID`), `createdAt`, `updatedAt` (ISO 8601).
- Relacionamentos por **ID normalizado**, nunca aninhamento — exceto value-objects que só existem dentro do pai (checklist jurídico dentro de Ativo; linhas financeiras dentro de Business Case; medições dentro de KPI).
- Campos opcionais explícitos (`?`). Nada é obrigatório além de `id`, datas e um campo de identificação.
- Datas em ISO 8601 no armazenamento; formatação pt-BR só na UI.

## As 9 entidades

| # | Entidade | Store Dexie | Índices |
|---|----------|-------------|---------|
| 1 | `Ativo` | `ativos` | id, tipo, nome |
| 2 | `Stakeholder` | `stakeholders` | id, pilar, ativoId, hipoteseId, validacao |
| 3 | `Evidencia` | `evidencias` | id, pilar, fonte, ativoId, stakeholderId, hipoteseId, confianca |
| 4 | `Hipotese` | `hipoteses` | id, pilar, status |
| 5 | `Oportunidade` | `oportunidades` | id, status |
| 6 | `BusinessCase` | `businessCases` | id, oportunidadeId |
| 7 | `Decisao` | `decisoes` | id, data |
| 8 | `Tarefa` | `tarefas` | id, horizonte, status, businessCaseId |
| 9 | `KPI` | `kpis` | id, pilar |
| — | `AnalisePilar` (análise) | `analises` | id, pilar |
| — | `ComparavelImobiliario` (mód. 03) | `comparaveis` | id, tipo |
| — | `Config` (auxiliar) | `config` | chave |

> `AnalisePilar` guarda o SWOT (4 quadrantes de itens) + leitura executiva + recomendações,
> uma por pilar. Não é uma das 9 entidades de domínio — é artefato de análise (aba "Análise").
>
> `ComparavelImobiliario`: imóvel pesquisado no mercado (m², preço, aluguel, fonte), base do
> cálculo de R$/m² médio por tipo no módulo 03.
>
> **Reúso deliberado (abordagem enxuta da Fase 3):** dados econômicos, atrativos turísticos e
> demandas do agro NÃO ganharam entidade própria — são `Evidencia` do pilar correspondente, com
> `fonte`/`fonteDetalhe`/`confianca`. Sazonalidade do agro fica em `Config` (`sazonalidade_agro`).
> Cenários de uso ficam no próprio `Ativo` (`cenariosUso`).

## Relacionamentos (texto)

```
Ativo 1──* Stakeholder        (Stakeholder.ativoId)
Ativo 1──* Evidencia          (Evidencia.ativoId)
Stakeholder 1──* Evidencia    (Evidencia.stakeholderId)
Hipotese 1──* Evidencia       (Evidencia.hipoteseId)   ← base da validação
Hipotese *──* Oportunidade    (Oportunidade.hipoteseIds[])
Oportunidade 1──1 BusinessCase(BusinessCase.oportunidadeId)
Decisao *──* Hipotese/Evidencia (Decisao.hipoteseIds[], evidenciaIds[])
BusinessCase 1──* Tarefa      (Tarefa.businessCaseId)
Tarefa *──* Tarefa            (Tarefa.dependenciasIds[])
```

## Regra de ouro

**Hipótese ≠ Evidência ≠ Decisão.** Entidades separadas, badges/cores distintas na UI.
Uma `Hipotese` só pode ir a `status: 'validada'` com **≥ N evidências vinculadas**
(`Config.minEvidenciasParaValidar`, default 3 — `getMinEvidencias()` em `database.ts`).

## Histórico de decisões de schema

### v3 (cont.) — 2026-07-08 — módulos de decisão (Fase 4)
- `BusinessCase.oportunidadeId` passou a ser **opcional** — um BC pode nascer da promoção de uma
  oportunidade ou ser criado avulso. Campo indexado opcional; sem migração de versão.
- Sem novas stores: `Oportunidade` e `BusinessCase` (entidades 5 e 6) já existiam desde a Fase 1.
- `Config`: `pesos_priorizacao` (pesos ajustáveis do score composto, default impacto 1 / investimento 0,5 / risco 0,5).
- Fluxo de promoção implementado em `db/actions.ts`: hipótese → oportunidade → business case
  (marca a oportunidade como `promovida`). Cálculos puros em `lib/calc/priorizacao.ts` (score, quadrante)
  e `lib/calc/financeiro.ts` (totais, payback = CAPEX ÷ lucro mensal; null quando não se sustenta).

### v3 — 2026-07-07 — dados dos diagnósticos 03/04/06/07 (Fase 3)
- Nova store `comparaveis` (`ComparavelImobiliario`) para o cálculo de R$/m² médio por tipo (módulo 03).
- Campo opcional `Ativo.cenariosUso` (alugar/retrofit/desenvolvimento/venda, cada um com prós/contras).
- Tipos `SazonalidadeMes`/`IntensidadeSazonal` (módulo 06), persistidos em `Config` (`sazonalidade_agro`).
- **Decisão de escopo (enxuta, aprovada pelo usuário "sem preferência"):** 04 Econômico, 06 (demandas)
  e 07 Turístico reúsam `Evidencia` em vez de entidades novas — dado com fonte + grau de confiança,
  separando fato (confiança alta/média) de especulação (baixa). Menos schema, mesma cobertura da spec.
- `comparaveis` incluída em backup/restore e `limparTudo`. Migração `version(3)` aditiva.

### v2 — 2026-07-07 — análise por pilar (Fase 2)
- Nova store `analises` com a entidade `AnalisePilar` (`Swot` + `leituraExecutiva` + `recomendacoes`),
  uma por pilar (`obterOuCriarAnalise` cria sob demanda; unicidade lógica por `pilar`).
- Incluída em backup/restore e em `limparTudo`. Migração `version(2)` aditiva — nenhum dado v1 alterado.
- Regra de validação da hipótese (≥ N evidências) passou a ser **enforçada na camada de dados**
  (`salvarHipotese` em `db/actions.ts`), não só na UI.

### v1 — 2026-07-07 — schema inicial (Fase 1)
- Criadas as 9 entidades conforme SPEC.md § "MODELO DE DADOS CENTRAL".
- **Adição aprovada pelo usuário:** `Stakeholder.valorCitado?: string` — valor citado
  pelo entrevistado (texto livre). Não estava na spec original; mantido para não perder
  esse dado que existe na ferramenta de campo. Aprovado explicitamente (ponto 4 da fase de aprovação).
- **Adição de apoio:** `Evidencia.fonteDetalhe?: string` — rótulo livre da origem específica
  (ex.: "Registro de campo — Rota Comercial"), para preservar a informação de origem no
  mapeamento de rotas → pilar sem perda (ponto 2 da aprovação).
- **Rastreabilidade de import:** `OrigemImportacao` (em Ativo, Stakeholder, Evidencia) com
  `camposNaoMapeados` — garante zero perda: todo campo de origem sem destino é preservado aqui.
