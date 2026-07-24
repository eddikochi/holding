# SPEC — Modelo de Dados e Backlog Ordenado
## Masterplan São Borja / Holding Kochi

> **Fonte de verdade para a próxima fase.** Este documento define o modelo de
> relação entre Evidência, Hipótese e Pilar, o princípio que orienta o produto,
> e o backlog em **ordem de execução**. O Claude Code deve ler este arquivo antes
> de qualquer implementação desta fase e atualizar a ordem conforme as demandas
> avançam. Nada sai do backlog — apenas muda de prioridade.

---

## 0. Princípio orientador (por que o app existe)

O objetivo do app **não é centralizar uma grande quantidade de informação**.
É usar essa informação para **gerar decisão**: dashboards, insights, matrizes —
de forma visual, intuitiva e de fácil escaneabilidade.

Todo modelo de dado, tela e campo deve ser desenhado perguntando:
**"como isto vira insight de decisão depois?"** — não apenas "onde guardo o fato".

**Exemplo âncora do insight-alvo (o que o dashboard final deve responder):**
Cruzar Evidência + Hipótese + Comparativo + SWOT para mostrar
**"onde há mais chance de dar certo e onde está a dor"** — ou seja:
qual oportunidade tem mais evidência a favor (quantas a sustentam, com que
confiança), qual hipótese está validada ou refutada, o que o comparativo de
mercado diz em número, e o que o SWOT sinaliza de força/risco. A decisão sai
do cruzamento, não da leitura de um pilar isolado.

Consequência de design: **isto reflete em todos os pilares e em todas as abas.**
O modelo abaixo é transversal, não local a um pilar.

---

## 1. Método de trabalho (como esta fase opera)

1. **Modelagem de dados vem antes da UX/UI.** Desenhar o fluxo de dados é
   pré-requisito para evitar retrabalho. Quando uma demanda depende de uma
   decisão de modelo ainda não tomada, ela espera — mas fica registrada.
2. **Nada sai do backlog.** Adiar ≠ esquecer. A ordem de prioridade muda; a
   lista de demandas só cresce ou se completa.
3. **Gates.** Toda mudança de schema ou dado: auditar (só leitura) → mostrar
   diff/amostra → pausar para aprovação → implementar → verificar backup.
4. **Aditivo e retrocompatível.** Nunca renomear field key existente.
   `0 ≠ vazio` (undefined para vazio, nunca 0). Backup íntegro ao final de cada gate.
5. **App é live para a família.** Pushes são públicos. Exportar backup antes de
   qualquer migração de dado.
6. **Demanda adiada entra no SPEC na mesma sessão em que é decidida.** Combinar
   algo num chat sem registrar aqui = combinar com data de validade: quando o
   chat fecha, a demanda se perde. O SPEC só protege o que foi escrito nele.
   Registrar não é tarefa de fim de projeto — é na hora.

---

## 2. Modelo de relação — Evidência ↔ Hipótese ↔ Pilar

**Decisão fechada (aprovada nesta sessão).**

### 2.1 Evidência e Hipótese são globais
- Cada uma tem **ID único e imutável** no app inteiro: `EV-1`, `HIP-1`.
- O ID **não carrega pilar** (nada de `JUR-EV-1`). Pilar é etiqueta separada.
- ID nasce na criação e **nunca muda** — deletar EV-3 não renumera EV-4.
  Referências cruzadas dependem de estabilidade.

### 2.2 Pilar é etiqueta múltipla (não dono)
- Evidência: `pilares: Pilar[]` (uma ou várias).
- Hipótese: `pilares: Pilar[]` (uma ou várias).
- Uma evidência que serve a vários pilares **existe uma vez** e é etiquetada com
  vários — **nunca duplicada**. No dashboard, conta uma vez e aparece onde for relevante.
- **Múltiplo é possível, nunca obrigatório.** O caso comum (um pilar) segue
  simples e rápido: cria no pilar onde se está trabalhando, padrão de um.
  Adicionar outro pilar é opção, feita sem sair da tela, **nunca um bloqueio ou
  alerta que quebre o fluxo de UX**.

### 2.3 Vínculo Evidência → Hipótese carrega efeito, e é múltiplo
- Uma evidência pode se ligar a **várias hipóteses** (hoje o schema só permite uma).
- Cada vínculo carrega **efeito**: `sustenta | refuta | neutro`.
- Isto transforma o app de "depósito de fatos" em **funil de validação** — que é
  a natureza do projeto ("validar hipóteses antes de investir"). Uma evidência
  pode sustentar HIP-1 e enfraquecer HIP-3 ao mesmo tempo; o dashboard mostra isso.

### 2.4 Impacto no schema (a auditar antes de escrever)
Hoje (confirmado em backup real):
- `Evidencia.pilar: string` (único) → passa a `pilares: Pilar[]`
- `Evidencia.hipoteseId: string` (único) → passa a estrutura de múltiplos
  vínculos com efeito (ex: `vinculos: { hipoteseId, efeito }[]`)
- `Hipotese.pilar: string` (único) → passa a `pilares: Pilar[]`
- Novo: `codigo: string` em Evidencia e Hipotese (ver seção 3)

**Migração retrocompatível obrigatória:** todo registro atual com `pilar` único
vira `pilares: [aquele_pilar]`; todo `hipoteseId` único vira
`vinculos: [{ hipoteseId, efeito: 'sustenta' }]` (efeito default a revisar por item).

---

## 3. Formato de ID (fundação do cruzamento)

- **Evidência:** `EV-{n}` — n sequencial **global**, único no app.
- **Hipótese:** `HIP-{n}` — n sequencial **global**, número (não letra).
- Gerado por **contador persistente** no banco (não por count() de array, que
  reindexaria após delete). Dois contadores: `proxEV`, `proxHIP`.
- **Imutável.**

### 3.1 Migração dos IDs manuais existentes
Os "IDs" atuais foram digitados à mão dentro do campo de texto
(`conteudo` / `enunciado`), como paliativo para uma escaneabilidade que não
existia. São **inconsistentes e colidem** (há dois EV-3, dois EV-4, dois EV-5;
`EV-7` e `EV-7-JUR`). Padrões observados: `[EV-5] ---`, `[EV-4]---` (sem espaço),
`[EV-7-JUR] ---` (sufixo), `[EV-9] ---  ` (espaço duplo).

Regras de migração (com backup antes, amostra de 3 antes de aplicar a todos):
- Parsear o código do texto de forma tolerante às variações acima.
- **Limpar** o prefixo do texto (remover `[EV-N]`, `[HIP-X]`, sufixos `-JUR`,
  separadores `---` e espaços) — o texto limpo fica no campo de conteúdo.
- **Não preservar cegamente** o número manual (eles colidem). Reatribuir na
  sequência global, registrando o número antigo em observação/origem para rastro.
- Hipóteses hoje em letra (`HIP-A/B/C`): mapear **A→1, B→2, C→3** para preservar
  a ordem que já existe. Sufixo `-JUR` das hipóteses jurídicas: o pilar vira
  etiqueta (`pilares: [juridico]`), não parte do código.

---

## 4. BACKLOG EM ORDEM DE EXECUÇÃO

> A ordem reflete **dependência técnica**, não urgência percebida. Cada item
> depende do anterior existir. Atualizar esta ordem conforme avança.

### ▶ FASE 1 — Modelo de dados (FUNDAÇÃO, não fatiável)
Reflete em todos os pilares de uma vez (é schema compartilhado).
- [x] 1.1 Auditar schema real de Evidencia e Hipotese (só leitura, reportar keys).
- [x] 1.2 `pilares: Pilar[]` em Evidencia e Hipotese (migrar único → lista). Índice multiEntry `*pilares` (Dexie v4).
- [x] 1.3 Vínculo múltiplo com efeito (`sustenta/refuta/neutro`) Evidencia→Hipotese. Regra de ouro conta só `sustenta`.
- [x] 1.4 Migração retrocompatível: upgrade Dexie v4 + normalização no import. Amostra de 3 verificada; **aplicada aos 46 reais (aprovado "ok para todos", 2026-07-21) com backup antes.**
- [x] 1.5 Backup round-trip verificado lossless (evidências+hipóteses); índice multiEntry verificado.

### ▶ FASE 2 — ID estruturado (depende da Fase 1)
- [x] 2.1 Campo `codigo` (EV-{n}/HIP-{n}) + `codigoLegado`; contadores `proxEV`/`proxHIP` em Config; atribuição ao salvar novos. Dexie v5.
- [~] 2.2 Parse+limpeza dos IDs manuais (opção a). Dry-run no backup real conferido (33 EV → EV-1..33, 14 com legado; 13 HIP). **Aplica aos 46 da família no reload, após backup.** Upgrade v5 verificado no preview (bate com o dry-run).
- [x] 2.3 HIP-A/B/C → HIP-1/2/3; HIP-JUR-2 → HIP-4. `-JUR` só rastro (`codigoLegado`), pilar já é juridico.
- [x] 2.4 Backup round-trip verificado lossless (`codigo`/`codigoLegado` preservados); import de backup pré-Fase-2 atribui código (guardado).

### ▶ FASE 3 — UX/UI do COMPARTILHADO (depende da Fase 2)
Abas **Onboarding, Discovery, Análise** — mesmo componente em todos os pilares.
Ao bater o martelo, **reflete em todos de uma vez**. Não é fatiável por pilar.
- [x] 3.1 Confiança = ponto colorido (`PontoConfianca`, verde/âmbar/vermelho) com tooltip; sem "Confiança" repetido.
- [x] 3.2 "Vinculada a" = dropdown `codigo · nome` (sem ID manual/legado) + seletor de efeito ao lado (decisão c). Multi-vínculo → backlog §5.
- [x] 3.3 Conteúdo truncado (`.txt-clamp`, 2 linhas + "…"); completo no Editar.
- [x] 3.4 Coluna `codigo` própria + ordenação numérica (EV-2 antes de EV-10), em Evidências e nas hipóteses do Discovery.
- [x] 3.5 Funil conta só `sustenta` + contador separado de `refuta`; efeito por linha no Discovery; resumo do funil na Análise. Verificado no Logístico e Imobiliário; backup íntegro.

### ▶ FASE 4 — UX/UI do ESPECÍFICO (aba Dados, UM PILAR POR VEZ)
Cada pilar tem dor e estrutura própria na aba Dados. Trabalhar individualmente.
- [x] 4.0 Patrimonial — padrão de card de 3 camadas (CONCLUÍDO: âncoras, área contextual, faixa de status via `statusDominio`, ler/editar separado).
- [x] 4.1 Padrão de tabela definido e materializado num componente **reaproveitável** `TabelaAgrupadaMediana` (métrica derivada = coluna de ênfase à direita, ordenação asc, linha de mediana, bloco de incompletos, agrupamento por realidade). Mediana em `lib/estatistica.ts`.
- [x] 4.2 Imobiliário: comparáveis agrupados por tipo (Galpões mediana R$ 14,04/m² · Lojas R$ 20,52/m²), R$/m² derivado em render, sem m² no rodapé recolhível, painel de médias removido, `bairro` inline + `codigo` no Editar. Backup íntegro. Testado (desktop + mobile sem scroll horizontal).
- [x] 4.3 Logístico — padrão próprio (estado + honestidade do vazio, SEM TabelaAgrupadaMediana): indicador "N perfis desk · M entrevistados — aguardando campo"; etiqueta desk/real por player (prop opt-in `estadoDesk`); ranking vira lista simples (dor + segmento) enquanto contagem = 1; filtro derivado curto/hub (heurística, sem campo novo, reversível, padrão Todos). "Diagnóstico do galpão" passou a usar **referência explícita** (Config `logistico_ativosIds` + seletor), não `tipo==='galpao'` — um terreno/oficina pode ser o galpão. Só UI + Config. Testado, backup íntegro.
- [ ] 4.4 Jurídico (checklist de 9 itens por ativo).
- [ ] 4.5 Econômico (indicadores).

### ▶ FASE 5 — Dashboard de decisão (a frente grande, por último)
Depende de tudo acima. É onde o princípio da seção 0 se realiza.
- [ ] 5.1 Cruzar Evidência + Hipótese + Comparativo + SWOT.
- [ ] 5.2 Responder "onde há mais chance de dar certo e onde está a dor":
      qual oportunidade tem mais evidência a favor e menos risco.
- [ ] 5.3 Substituir a âncora de "avaliação fiscal" (venal, subvalorizada) por
      **valor de mercado estimado** calculado via comparável (R$/m² × área).

---

## 5. BACKLOG PARALELO (não bloqueia — fazer quando couber)
- [ ] **Multi-vínculo por evidência (UI):** o modelo já suporta `vinculos: {hipoteseId,efeito}[]`
      com N vínculos, mas a UI da Fase 3 mantém **um** vínculo por evidência (dropdown único +
      seletor de efeito). Construir a UI para ligar uma evidência a **várias** hipóteses, cada uma
      com seu efeito (sustenta/refuta/neutro). Adiado da F3 por decisão (2026-07-21).
- [ ] Case de portfólio: montar os antes/depois de UX/UI desta sessão (card
      patrimonial, linha de evidência) como material de case. Narrativa de
      decisão já existe no histórico da sessão.
- [ ] Mapa do produto (case de portfólio): diagrama do objetivo, modelo de dados
      (Evidência/Hipótese globais ↔ pilar como etiqueta múltipla ↔ vínculo com
      efeito), fluxo diagnóstico → evidência → hipótese → validação → oportunidade
      → priorização → business case → decisão, e a espinha de fases como histórico
      de construção. NÃO vai para dentro do app — o onboarding já cobre o uso.
      Munição já existente: antes/depois do card Patrimonial, da linha de
      evidência e do tabelão de comparáveis.
- [ ] Campo `titulo` opcional nas evidências (só se o truncamento não bastar).
- [ ] **Categoria de dor (Logístico):** o ranking de dores agrupa pelo TEXTO do campo
      `dorOportunidade` (categoria antes de " — "), então só soma quando os players digitam
      igual. Avaliar um campo estruturado de **categoria** (separado do detalhe livre) para o
      ranking agrupar de forma robusta, sem depender de digitação idêntica. Mexe em schema →
      propor antes. Só fazer se o ranking em campo provar que a agregação por texto não basta.
- [ ] Replicar o padrão de card patrimonial em outros pilares de inventário, se houver.
- [ ] **Card OPERACIONAL do galpão no Logístico (≠ patrimonial):** o "Diagnóstico do galpão"
      hoje é uma linha mínima. Evoluir para um card com os campos que importam à OPERAÇÃO
      logística — acesso/docas, pé-direito, área útil/coberta, vãos, piso/carga — em vez do
      enquadramento patrimonial (avaliação fiscal, enfiteuse etc.). Mesmo ativo, leitura
      diferente por pilar. Verificar se os campos já existem em `Ativo.metragens` (peDireitoM,
      construidaM2) ou se exige campo aditivo — se exigir, propor antes (gate de schema).
- [ ] Campo de domínio explícito já resolvido no Patrimonial (`statusDominio`);
      avaliar se outros status de pilar precisam do mesmo tratamento (enum vs texto).
- [ ] **Varredura de chats antigos:** buscar em conversas anteriores deste projeto
      demandas que foram combinadas mas nunca entraram em nenhum SPEC (risco real
      de itens perdidos em chats fechados). Recuperar o que der e registrar aqui.
- [ ] **Avaliar skill de captura de backlog:** uma skill que, ao fim de sessões de
      planejamento, force a pergunta "o que decidimos que ainda não está no SPEC?".
      Só construir depois de validar que a regra simples (registrar na hora, seção 1.6)
      não basta sozinha — não construir a rede antes de saber se cai.

---

## 6. Dependências duras (a espinha — não inverter)
```
Modelo de dados (F1)  →  ID estruturado (F2)  →  UX compartilhado (F3)
                                                        ↓
                          UX específico por pilar (F4)  →  Dashboard (F5)
```
Fazer UX antes do modelo = retrabalho garantido. O visual das tabelas exibe
pilar-múltiplo e vínculo-com-efeito, que só existem depois da Fase 1.
