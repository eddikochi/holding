# PROMPT — CLAUDE CODE — APP MASTERPLAN SÃO BORJA (v1.0)

## CONTEXTO DO PROJETO

Sou responsável por estruturar o desenvolvimento patrimonial da minha família em São Borja/RS (fronteira com a Argentina). A família possui ativos físicos (galpão, terrenos, loja comercial, oficina e outros imóveis) e o objetivo é transformá-los em um ecossistema de oportunidades de negócio, **validando hipóteses antes de qualquer investimento relevante**.

A pergunta-mestre do projeto é:
> "Quais oportunidades de negócio existem em São Borja a partir dos ativos que já possuímos?"

O projeto NÃO parte da premissa de que o Hub Logístico é a resposta. O Hub Logístico é a tese mais desenvolvida até agora, mas é apenas um dos pilares. A metodologia é: diagnóstico → discovery → validação de hipóteses → priorização → business cases → roadmap.

Restrições práticas importantes:
- Moro em Porto Alegre; visitas presenciais a São Borja acontecem no máximo 3x por ano.
- Já existe uma **ferramenta de campo** (HTML único, offline, localStorage) usada para capturar dados presenciais. Ela exporta JSON com a estrutura `{ativos:[], stakeholders:[], registros:[]}` (chave localStorage `sb_masterplan_v1`). **O novo app DEVE importar esse JSON sem perda de dados.**
- O trabalho analítico (cruzamento, matrizes, business cases, roadmap) acontece em Porto Alegre, entre viagens.

## O QUE CONSTRUIR

Um app web local-first chamado **Masterplan São Borja** que cubra a estrutura completa abaixo (do print de referência), com profundidade e didática:

```
MASTERPLAN SÃO BORJA
├── 01. Diagnóstico Patrimonial
├── 02. Diagnóstico Jurídico
├── 03. Diagnóstico Imobiliário
├── 04. Diagnóstico Econômico
├── 05. Diagnóstico Logístico
├── 06. Diagnóstico Agroindustrial
├── 07. Diagnóstico Turístico
├── 08. Oportunidades de Negócio
├── 09. Priorização (Impacto × Investimento × Risco)
├── 10. Business Cases
│   ├── Hub Logístico
│   ├── Projeto Imobiliário
│   ├── Serviços de Fronteira
│   ├── Turismo
│   └── Novos Negócios
├── 11. Roadmap de Implantação
└── 12. Governança Familiar
```

## ARQUITETURA E STACK

- **React + Vite**, SPA, sem backend. Tudo roda local.
- Persistência: **IndexedDB** (via biblioteca leve como `idb` ou Dexie) com fallback/espelho de export manual. Motivo: o volume de dados (evidências, fotos futuras, matrizes) vai estourar o conforto do localStorage.
- Export/Import completo em **JSON** (backup) + export **CSV** por entidade (para Excel/Sheets).
- Import do JSON da ferramenta de campo (`{ativos, stakeholders, registros}`) com mapeamento automático para o novo modelo de dados. Mostrar preview antes de confirmar o import.
- Gráficos: **Recharts** (barras, pizza, linha, radar para SWOT comparativo).
- Mapas: **Leaflet + OpenStreetMap** para plotar ativos e stakeholders com lat/lng manual ou por clique no mapa. Se offline, degradar graciosamente (mostrar lista em vez de tiles).
- Sem autenticação, sem nuvem, sem tracking.
- Idioma da interface: **português brasileiro**.
- Responsivo (uso principal em desktop, consulta em celular).

## MODELO DE DADOS CENTRAL (única fonte de verdade, compartilhada entre módulos)

Todas as entidades têm `id`, `createdAt`, `updatedAt`.

1. **Ativo** — nome, tipo (galpão/terreno/loja/oficina/outro), endereço, lat/lng, metragens, estado físico, fotos (base64 ou referência), potencial por pilar, situação jurídica resumida, checklist jurídico detalhado (matrícula, inventário, sucessão, zoneamento, licenciamento, ambiental, tributação, contratos, holding/SPE — cada item com status + observação + responsável + prazo).
2. **Stakeholder** — nome, pilar, segmento, contato, local, ativoId (opcional), dor/oportunidade, urgência, disposição, hipóteseId, validação, próximo passo, data.
3. **Evidência** — texto/observação/foto/documento, pilar, fonte (entrevista, observação de campo, pesquisa desk, dado oficial), data, vínculos (ativoId, stakeholderId, hipoteseId). Toda evidência tem grau de confiança (alto/médio/baixo).
4. **Hipótese** — enunciado, pilar, critérios de validação, status (não validada/parcial/validada/refutada), evidências vinculadas, decisão associada.
5. **Oportunidade** — nome, pilar(es), descrição, hipóteses relacionadas, estimativa de impacto (1-5), investimento (1-5), risco (1-5), esforço (1-5), status.
6. **Business Case** — vinculado a uma oportunidade priorizada; contém: resumo executivo, modelo de negócio, premissas, CAPEX/OPEX estimado (tabela editável simples), receitas projetadas, payback simplificado, cenários (pessimista/realista/otimista), riscos, decisão go/no-go/aguardar.
7. **Decisão** (Decision Log) — data, contexto, decisão, motivo, quem decidiu, reversível ou não, hipóteses/evidências que embasaram.
8. **Tarefa/Marco** (roadmap) — título, pilar, horizonte (0-12m / 1-3a / 3-5a / 5-10a), status, dependências, responsável.
9. **KPI** — nome, pilar, valor alvo, valor atual, unidade, histórico de medições.

**Regra de ouro do modelo:** hipótese ≠ evidência ≠ decisão. A interface deve deixar essa distinção visível o tempo todo (cores/badges diferentes). Nenhuma hipótese pode ser marcada "validada" sem pelo menos N evidências vinculadas (configurável, default 3).

## ESTRUTURA DE TELAS

### Home / Visão Geral
- Mapa de progresso dos 12 módulos (% preenchido de cada um).
- Alertas automáticos: pilares sem dados, hipóteses sem evidência, pendências jurídicas, tarefas atrasadas.
- Acesso rápido: importar dados de campo, backup, últimas atividades.

### Padrão de cada módulo de Diagnóstico (01 a 07)
Cada módulo tem **3 abas fixas**:
1. **Onboarding** — tela de entrada didática explicando: o que este diagnóstico responde, por que importa antes de investir, quais dados coletar, onde coletar (campo vs. desk), critérios de "pronto". Escrito em linguagem direta, sem jargão. Inclui checklist de discovery do pilar com progresso.
2. **Dados** — formulários e tabelas específicos do pilar (detalhados abaixo) + evidências vinculadas + hipóteses do pilar com status.
3. **Análise** — SWOT editável do pilar (4 quadrantes, itens arrastáveis), gráficos automáticos a partir dos dados, campo de "leitura executiva" (texto livre de conclusões) e recomendações.

Conteúdo específico por diagnóstico:
- **01 Patrimonial**: inventário de ativos (importa da ferramenta de campo), ficha completa por ativo, mapa com todos os ativos plotados, resumo de potencial por pilar.
- **02 Jurídico**: visão consolidada do checklist jurídico de todos os ativos, matriz ativo × item jurídico com status colorido, lista de pendências com responsável/prazo, seção sobre holding/SPE (prós, contras, campo de anotações de consulta com advogado — deixar claro que o app não substitui parecer jurídico).
- **03 Imobiliário**: comparáveis de mercado (tabela de imóveis pesquisados: tipo, m², preço pedido, aluguel, fonte, data), cálculo automático de R$/m² médio por tipo, cenários de uso por ativo (alugar como está / retrofit / desenvolvimento / venda) com prós e contras.
- **04 Econômico**: dados demográficos e econômicos da região (campos para registrar dado + fonte + data — nunca inventar número), incentivos municipais/estaduais mapeados, seção corredor bioceânico e comércio Brasil–Argentina (fatos vs. especulação separados visualmente).
- **05 Logístico**: absorve a ferramenta do hub já criada — diagnóstico do galpão, players logísticos, dores recorrentes, ranking de dores, hipóteses do hub, status do MVP "espaço logístico flexível modular". É o pilar mais maduro; a tela deve refletir isso mostrando o funil: hipóteses → evidências → validação → business case.
- **06 Agroindustrial**: players do agro mapeados, demandas de armazenagem/beneficiamento/serviços ao produtor, sazonalidade (calendário anual simples), possíveis parcerias.
- **07 Turístico**: inventário de atrativos (Missões, patrimônio histórico, Guerra do Paraguai, identidade local), fluxo turístico estimado (com fonte), ideias de experiência/conteúdo audiovisual. Marcar visualmente que este pilar tende a ser projeto separado — registrar sem misturar com decisão de investimento dos demais.

### 08. Oportunidades de Negócio
- Lista mestre de oportunidades (criadas manualmente ou promovidas a partir de hipóteses validadas).
- Cada oportunidade mostra: pilares, hipóteses ligadas, evidências, notas de impacto/investimento/risco/esforço.
- Filtros por pilar e status.

### 09. Priorização
- **Matriz Impacto × Esforço** interativa: oportunidades como cards arrastáveis nos 4 quadrantes (quick wins / apostas grandes / preencher tempo / descartar). Posição salva.
- **Ranking Impacto × Investimento × Risco**: tabela ordenável com score composto configurável (pesos ajustáveis).
- Botão "promover a Business Case" para as top oportunidades.

### 10. Business Cases
- Um card por business case (Hub Logístico, Projeto Imobiliário, Serviços de Fronteira, Turismo, Novos Negócios + criar novo).
- Template guiado por seções (resumo, modelo, premissas, CAPEX/OPEX, receitas, payback, cenários, riscos, decisão).
- Tabelas financeiras simples e editáveis com totais automáticos — sem fórmulas complexas, transparência acima de sofisticação.
- Todo número deve ter campo "fonte/premissa" ao lado. Números sem fonte ficam com badge de alerta.

### 11. Roadmap de Implantação
- Visão por horizonte (0-12m / 1-3a / 3-5a / 5-10a) em colunas tipo kanban + visão cronograma (linha do tempo simples, sem lib de Gantt pesada).
- Tarefas/marcos vinculados a pilares e business cases.
- Dependências visíveis (lista "bloqueado por").

### 12. Governança Familiar
- Papéis familiares (nome, papel, responsabilidades).
- Modelo decisório (texto estruturado: o que cada nível pode decidir sozinho).
- Ritos (reuniões, frequência, pauta padrão).
- **Decision Log** completo: tabela filtrável de todas as decisões, com vínculos para hipóteses/evidências.
- KPIs do projeto: cadastro e acompanhamento com mini-gráficos de evolução.

## PRINCÍPIOS DE UX (obrigatórios)

1. **Didático em primeiro lugar**: cada tela de entrada explica o "porquê" antes do "como". Usuário leigo em metodologia deve conseguir navegar.
2. **Onboarding progressivo**: primeira visita a cada módulo mostra o onboarding; depois fica acessível por botão "?" no cabeçalho do módulo.
3. **Estado vazio útil**: toda tela vazia diz o que fazer primeiro e de onde vêm os dados (campo ou desk).
4. **Nunca esconder a incerteza**: evidência com confiança baixa aparece diferente de confiança alta; número sem fonte tem alerta; hipótese não validada nunca parece fato.
5. **Design system próprio, sóbrio e prático**: paleta neutra com uma cor de destaque por família de ação (não uma cor por pilar em excesso), tipografia de sistema, componentes consistentes (mesmos botões, tags, tabelas em todos os módulos). Nada decorativo que atrapalhe uso em campo.
6. Acessível: navegável por teclado, foco visível, contraste AA.

## TIME DE AGENTES (criar em .claude/agents/)

Configure subagents do Claude Code para dividir o trabalho:

1. **architect** — dono do modelo de dados e da estrutura de pastas. Toda mudança de schema passa por ele. Mantém `docs/DATA_MODEL.md` atualizado.
2. **ui-builder** — constrói telas e componentes seguindo o design system. Não inventa componentes novos se já existir equivalente. Mantém `docs/COMPONENTS.md`.
3. **data-logic** — implementa persistência (IndexedDB), import/export, migração do JSON da ferramenta de campo, cálculos (scores, R$/m², payback simplificado, progresso por módulo).
4. **content-writer** — escreve todos os textos de onboarding, estados vazios, tooltips e microcopy em PT-BR, tom direto e didático, sem jargão corporativo. Baseia os onboardings no material de discovery existente (hipóteses do hub logístico, checklists jurídicos, metodologia de validação).
5. **qa-reviewer** — testa cada módulo entregue: import/export sem perda, persistência entre reloads, responsividade, estados vazios, edge cases (0 ativos, 1 ativo, 50 stakeholders). Mantém `docs/QA_CHECKLIST.md` com o que passou.

Crie também **skills** em `.claude/skills/` se ajudar:
- `masterplan-domain`: resumo do domínio (pilares, entidades, regras hipótese≠evidência≠decisão) para qualquer agente consultar.
- `design-tokens`: tokens do design system (cores, espaçamentos, tipografia) como referência única.

## FASEAMENTO OBRIGATÓRIO (não construir tudo de uma vez)

Entregar em fases, cada uma funcional e testada antes da próxima:

- **Fase 1 — Fundação**: setup do projeto, modelo de dados completo, persistência IndexedDB, import do JSON da ferramenta de campo, export/import de backup, Home com progresso, navegação entre os 12 módulos (ainda vazios com onboarding placeholder). *Critério de pronto: importo meu JSON de campo real e vejo ativos/stakeholders/registros dentro do app, fecho o navegador e os dados persistem.*
- **Fase 2 — Diagnósticos core**: módulos 01 Patrimonial, 02 Jurídico e 05 Logístico completos (os que já têm dados reais). *Critério de pronto: consigo ver o funil hipótese→evidência→validação do hub logístico com meus dados reais.*
- **Fase 3 — Demais diagnósticos**: 03, 04, 06, 07 com onboarding, dados e análise (SWOT + leitura executiva).
- **Fase 4 — Decisão**: 08 Oportunidades, 09 Priorização (matriz drag-and-drop + ranking), 10 Business Cases.
- **Fase 5 — Execução e governança**: 11 Roadmap, 12 Governança + Decision Log + KPIs, mapa Leaflet, polimento geral e passada final do qa-reviewer.

Ao final de cada fase: commit com mensagem descritiva, atualizar `docs/CHANGELOG.md` e me apresentar o que foi feito com instruções de teste manual.

## O QUE NÃO FAZER

- Não adicionar backend, login ou sincronização em nuvem.
- Não inventar dados de exemplo realistas (números econômicos, preços de mercado) — placeholders devem ser obviamente fictícios ou vazios.
- Não usar lib de Gantt/kanban pesada; construir simples.
- Não misturar o pilar Turismo/História nas análises de priorização por default (pode ser incluído manualmente).
- Não deixar nenhum módulo sem estado vazio e sem onboarding.
- Não otimizar prematuramente; clareza de código acima de esperteza.

## COMEÇO

Comece pela Fase 1. Antes de escrever código, apresente:
1. Estrutura de pastas proposta.
2. Schema completo das entidades (TypeScript types).
3. Plano de migração do JSON da ferramenta de campo para o novo modelo.

Só depois da minha aprovação dessas 3 coisas, implemente.
