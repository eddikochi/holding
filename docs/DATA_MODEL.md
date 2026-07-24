# Modelo de Dados — Masterplan São Borja

> Dono: agente **architect**. Toda mudança de schema passa por ele e é registrada aqui.
> Implementação canônica: `app/src/models/types.ts` · stores em `app/src/db/database.ts`.

## Versão de schema

- **Schema atual: v4** (`SCHEMA_VERSION = 4` em `database.ts`).
- v1 → v2: migração aditiva (nova store `analises`).
- v2 → v3: migração aditiva (nova store `comparaveis`); campo opcional `cenariosUso` no Ativo (não indexado, sem migração).
- v3 → v4: Evidencia/Hipotese passam a pilar-múltiplo (`pilares: Pilar[]`, índice multiEntry `*pilares`) e Evidencia troca `hipoteseId` único por `vinculos: {hipoteseId,efeito}[]` (não indexado, filtro em memória). Upgrade Dexie popula os campos novos a partir dos legados e remove os legados do storage.

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

## Entidades usadas por módulo (cada módulo usa um subconjunto)

Isto explica por que o conteúdo difere entre módulos (ex.: Imobiliário não tem "players" — é o desenho,
não perda de dado). Todos os diagnósticos também têm as abas Discovery (hipóteses/evidências) e Análise
(`AnalisePilar`/SWOT).

| Módulo | Entidades / dados que usa na aba Dados |
|---|---|
| 01 Patrimonial | `Ativo` (inventário, ficha, mapa) |
| 02 Jurídico | `Ativo.checklistJuridico` (matriz ativo × item) + notas holding em `Config` |
| 03 Imobiliário | `ComparavelImobiliario` + `Ativo.cenariosUso` — **não usa Stakeholder** |
| 04 Econômico | `Evidencia` (pilar econômico) |
| 05 Logístico | `Stakeholder` + `Evidencia` + `Hipotese` (funil) |
| 06 Agroindustrial | `Stakeholder` + `Evidencia` + sazonalidade (`Config`) |
| 07 Turístico | `Evidencia` (pilar turístico) |
| 08 Educação | `Stakeholder` + `Evidencia` + `Hipotese` |
| 09 Oportunidades | `Oportunidade` |
| 10 Priorização | `Oportunidade` (impacto/esforço) + pesos (`Config`) |
| 11 Business Cases | `BusinessCase` |
| 12 Roadmap | `Tarefa` |
| 13 Governança | `Decisao` + `KPI` + papéis/ritos/modelo (`Config`) |

Verificado por round-trip de backup (exportar → reimportar): as contagens de todas as 12 stores ficam
idênticas — o import **não descarta** entidade real. Ver docs/PROGRESSO.md para como o progresso lê essas entidades.

## Regra de ouro

**Hipótese ≠ Evidência ≠ Decisão.** Entidades separadas, badges/cores distintas na UI.
Uma `Hipotese` só pode ir a `status: 'validada'` com **≥ N evidências vinculadas**
(`Config.minEvidenciasParaValidar`, default 3 — `getMinEvidencias()` em `database.ts`).

## Histórico de decisões de schema

### v5 (cont.) — 2026-07-22 — Config `logistico_ativosIds` (galpão operacional)
- Nova chave em `Config` (store auxiliar `{chave, valor}`, sem mudança de schema/store):
  `logistico_ativosIds: ID[]` — ativos designados como galpão operacional do pilar logístico.
- Motivo: o bloco "Diagnóstico do galpão" filtrava `tipo==='galpao'` e não achava o ativo real
  (um terreno que é galpão). Passou a usar **referência explícita** escolhida pelo usuário, não
  heurística de tipo. Só UI + Config; backup round-trip verificado (a chave viaja em `config[]`).

### v5 (cont.) — 2026-07-22 — `bairro`/`codigo` em ComparavelImobiliario
- Campos aditivos `ComparavelImobiliario.bairro?: string` e `.codigo?: string` (metadados de
  pesquisa; já existiam nos dados de campo, agora tipados). Não indexados, sem migração Dexie.
- `bairro` aparece inline na tabela de comparáveis; `codigo` só no Editar (decisão do usuário).
- `BACKUP_SCHEMA_VERSION` 9 → 10. Backup round-trip verificado lossless.
- Contexto: Fase 4.2 do SPEC_MODELO_DADOS (padrão de tabela agrupada com mediana, piloto Imobiliário).

### v4 — 2026-07-21 — pilar-múltiplo + vínculo com efeito (Evidência/Hipótese)
- `Evidencia.pilar` e `Hipotese.pilar` (string única) → **`pilares: Pilar[]`**; índice Dexie
  `pilar` → **`*pilares`** (multiEntry). Uma evidência/hipótese existe uma vez e é etiquetada
  com vários pilares (nunca duplicada). Conta em cada pilar que etiqueta.
- `Evidencia.hipoteseId` (string única) → **`vinculos: { hipoteseId, efeito }[]`** com
  `efeito: 'sustenta' | 'refuta' | 'neutro'`. Índice `hipoteseId` **removido** (array de objeto
  não é indexável direto — filtro em memória; o dataset é pequeno).
- **Regra de ouro** passou a contar só evidências que **sustentam** (`efeito: 'sustenta'`).
- Legados `pilar`/`hipoteseId`: `@deprecated` no tipo (só p/ importar backups antigos), **removidos
  do storage** pelo upgrade Dexie v4 e pela normalização no import (`restaurarBackup`). Decisão (a):
  fonte única, sem drift. Helpers tolerantes `pilaresDe`/`vinculosDe` cobrem registros não-migrados.
- Fora de escopo (intocados): `Stakeholder.pilar`/`.hipoteseId` e `Oportunidade/Decisao.hipoteseIds`.
- `BACKUP_SCHEMA_VERSION` 7 → 8. Backup round-trip verificado lossless; índice multiEntry verificado.
- Aprovado com escopo travado (Fase 1 do SPEC_MODELO_DADOS). ID estruturado (`codigo`) é Fase 2.

### v3 (cont.) — 2026-07-21 — `statusDominio` explícito no Ativo
- Novo tipo `StatusDominio = 'resgatada' | 'pendente' | 'nao_avaliada'` e campo aditivo
  `Ativo.statusDominio?: StatusDominio`. Não indexado, sem migração Dexie; `SCHEMA_VERSION` segue 3.
- **Motivo:** a faixa de status de enfiteuse da nova ficha de leitura (piloto Patrimonial) derivava a cor
  de texto livre (`situacaoJuridicaResumo`) e mostrava "resgatada" (verde) falso em imóveis com foro/laudêmio
  pendentes. A cor agora lê **só este campo**; nunca infere de texto. undefined = não avaliada (cinza).
- Retrocompatível: ativos existentes ficam `undefined` (cinza) até preenchimento manual no formulário.
- Backup: **sem mudança** — o campo viaja em `BackupCompleto.ativos: Ativo[]`; import não gateia por versão.
- Exposto no formulário (`AtivoModal`, seção "Registro & valores") como select com os 3 valores + "— não informado —".
- Aprovado pelo usuário com escopo travado (piloto do padrão de ficha escaneável, só Patrimonial).

### v3 (cont.) — 2026-07-20 — `url` opcional em ComparavelImobiliario
- Campo aditivo `ComparavelImobiliario.url?: string` (link do anúncio de origem). Não indexado,
  sem migração Dexie (propriedade livre da store `comparaveis`). Nenhuma key renomeada/removida.
- Backup: `BACKUP_SCHEMA_VERSION` 6 → 7 (registro de formato; retrocompatível — import não gateia por versão).
- Aprovado pelo usuário com escopo travado (só o campo `url?` + injeção de 16 comparáveis de mercado
  via round-trip de backup). UI do módulo 03 ainda não expõe o campo (edição/exibição fica p/ depois).

### v3 (cont.) — 2026-07-09 — checklist de discovery marcável (Config)
- Novo tipo `ItemChecklistDiscovery { id, texto, categoria: 'campo'|'desk', feito, custom }`.
- Persistido em `Config`, chave **`discovery_checklist_v2_<slug>`** = `ItemChecklistDiscovery[]` (a chave v1
  antiga, `discovery_checklist_<slug>` = boolean[], deixou de ser usada).
- Inicializa na 1ª leitura a partir dos itens padrão do onboarding (`itensChecklistPadrao`, = coletarCampo
  como categoria campo + coletarDesk como desk); depois a lista persistida é a fonte (itens custom, edições
  e remoções ficam nela). Removido o campo `checklist[]` de `OnboardingModulo` (unificado com "quais dados
  coletar e onde").
- **Progresso do módulo na Home** dos diagnósticos passou a ser `progressoChecklist` (= % de itens marcados),
  em vez da heurística de presença de dados.

### v3 (cont.) — 2026-07-08 — 8º pilar Educação + roteiros (fase corretiva final)
- **Novo pilar `educacao`** (Educação / Economia Estudantil) no enum `Pilar` e em `PILARES`.
  São Borja é cidade universitária (Unipampa, UERGS, IFFar, privadas/EAD). Entra como diagnóstico
  módulo **08**; os módulos de decisão/execução foram renumerados para **09–13** (13 módulos no total;
  slugs de rota inalterados). Atualizados: `types.ts`, `progresso.contarPorPilar`, validadores do
  `importCampo`, `modulos.ts`, skill `masterplan-domain`.
- Sem nova entidade: Educação usa `Stakeholder`/`Evidencia`/`Hipotese`/`AnalisePilar` como os demais.
  Oportunidades já são multi-pilar (`Oportunidade.pilares[]`) — Educação cruza com Econômico e Imobiliário.
- Config novos: roteiro/tipos/perguntas ficam em código (`content/discovery.ts`), não no banco.

### v3 (cont.) — 2026-07-08 — fase corretiva (auditoria dos 3 itens)
- **Sem novas entidades.** Import do Hub agora cria `Hipotese` (id estável `hip_campo_<slug>` para
  não duplicar em re-import) a partir do campo `hipotese` de cada player, vincula `Stakeholder.hipoteseId`
  e gera uma `Evidencia` (fonte `entrevista`, com valorCitado no conteúdo) ligada à hipótese; entrevistas
  herdam o vínculo via player. Isso alimenta o funil de discovery ponta a ponta.
- Import passou a ser analisável antes de aplicar: `analisarAplicacao()` (puro) diz criados vs. atualizados
  por entidade comparando IDs; modos **mesclar** (bulkPut) ou **substituir** (limparTudo + add).
- Config: `onboarding_visto_<slug>` (1ª visita) e `discovery_checklist_<slug>` (checklist com progresso).
- Cálculo puro `lib/calc/discovery.ts` (funil por pilar). `Tabs` agora suporta modo controlado.

### v3 (cont.) — 2026-07-08 — execução e governança (Fase 5)
- Sem novas stores: `Tarefa`, `Decisao`, `KPI` (entidades 7–9) já existiam desde a Fase 1.
- Governança em `Config`: `governanca_papeis` (`PapelFamiliar[]`), `governanca_ritos` (`Rito[]`),
  `governanca_modelo` (texto). KPI usa `historico: Medicao[]` (valor atual = última medição).
- Nova dependência: `leaflet` (mapa do módulo 01), com `circleMarker` (sem imagens externas) para
  funcionar no HTML single-file; degradação para lista quando offline ou sem tiles.

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
