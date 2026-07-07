# Modelo de Dados — Masterplan São Borja

> Dono: agente **architect**. Toda mudança de schema passa por ele e é registrada aqui.
> Implementação canônica: `app/src/models/types.ts` · stores em `app/src/db/database.ts`.

## Versão de schema

- **Schema atual: v2** (`SCHEMA_VERSION = 2` em `database.ts`).
- v1 → v2: migração aditiva (nova store `analises`), sem transformação de dados existentes.

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
| — | `Config` (auxiliar) | `config` | chave |

> `AnalisePilar` guarda o SWOT (4 quadrantes de itens) + leitura executiva + recomendações,
> uma por pilar. Não é uma das 9 entidades de domínio — é artefato de análise (aba "Análise").

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
