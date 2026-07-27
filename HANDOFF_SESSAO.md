# HANDOFF — Onde retomar
## Masterplan São Borja / Holding Kochi

> Leia este arquivo E o `SPEC_MODELO_DADOS.md` antes de continuar. Este handoff
> diz ONDE parei e o que não pode se perder; o SPEC é a fonte de verdade do
> modelo de dados, das fases e do backlog. Se algo aqui contradiz o SPEC, o
> SPEC vence (ele é versionado no repo; este handoff é um retrato do momento).

---

## 1. Contexto de uma linha

App React+Vite+TS+Dexie (PWA local-first) que transforma o diagnóstico de ativos
da família em decisão de negócio. A sessão anterior partiu de uma dor de UX ("o
app está confuso de usar") e evoluiu para: (a) refino de UX pilar a pilar, (b)
reestruturação do modelo de dados, (c) desenho do dashboard de decisão (Fase 5).

---

## 2. Onde estou AGORA (estado ao fim da sessão)

**Fase 4 COMPLETA (4.0–4.5) e publicada na main.** Último commit da sessão:
`0335e89` (feat: Fase 4.4 Jurídico + 4.5 Econômico), push feito para `origin/main`.

**Fase 5 DOCUMENTADA no SPEC, ainda não construída.** Desenho aprovado, piloto
definido. É o próximo trabalho.

Espinha das fases (§6 do SPEC):
```
F1 modelo de dados ✅ → F2 ID estruturado ✅ → F3 UX compartilhado ✅
                                                      ↓
                        F4 UX por pilar ✅ → F5 Dashboard (PRÓXIMO)
```

---

## 3. O que foi CONSTRUÍDO nesta sessão (resumo, não repetir)

- **Fase 1 — modelo de dados (schema v4):** Evidência/Hipótese ganharam
  `pilares: Pilar[]` (etiqueta múltipla, era string única) e vínculo múltiplo
  com efeito (`sustenta`/`refuta`/`neutro`). Migração retrocompatível aplicada.
- **Fase 2 — ID estruturado (schema v5):** campo `codigo` (EV-{n}/HIP-{n}) global
  imutável + contadores persistentes; migração limpou os IDs manuais que estavam
  soltos no texto; `codigoLegado` guarda o número antigo. Colisões resolvidas.
- **Fase 3 — UX compartilhado (Evidências/Discovery/Análise):** confiança virou
  ponto colorido; vínculo virou dropdown `codigo · nome` + seletor de efeito;
  texto truncado; código como coluna ordenada; funil separa sustenta/refuta;
  resumo do funil na Análise.
- **Fase 4 — UX por pilar (aba Dados):**
  - 4.0 Patrimonial: card de 3 camadas (âncoras, área contextual, faixa de
    `statusDominio`, ler/editar separado).
  - 4.1 Padrão de tabela: componente `TabelaAgrupadaMediana` (métrica derivada +
    mediana por grupo + incompletos separados).
  - 4.2 Imobiliário: comparáveis com R$/m² como coluna-âncora, ordenado, mediana.
  - 4.3 Logístico: padrão próprio (estado desk/real, ranking honesto sem barras
    falsas, filtro curto-prazo/hub); seletor de galpão operacional via
    `Config.logistico_ativosIds` (referência explícita, não filtro por tipo).
  - 4.4 Jurídico: matriz de checklist, âncora = N pendências (o que trava),
    matriz no desktop / acordeão no mobile, `nao_iniciado` ≠ `nao_se_aplica`.
  - 4.5 Econômico: padrão estado+honestidade (qualitativo, sem métrica inventada).
- **Fase 5 — documentada** (não construída): ver §4 abaixo.
- **Limpeza:** removido o arquivo órfão `lib/calc/imobiliario.ts` (código morto),
  trazido pra main via cherry-pick.

---

## 4. PRÓXIMO PASSO — Fase 5, piloto da Zona 2

A Fase 5 está toda especificada no SPEC. Arquitetura em 3 zonas:
- Zona 1 "o que temos": Evidence Coverage (pilares × cobertura).
- Zona 2 "para onde ir": DOIS mapas 2×2 — (a) evidência × validação,
  (b) risco × retorno. **Piloto começa por (a).**
- Zona 3 "números": reusa comparativos existentes (R$/m², funil).

**Piloto definido: Zona 2, mapa (a) evidência × validação.** Mockup já aprovado
na sessão anterior (bolhas por hipótese: posição = evidência × validação,
tamanho = evidência acumulada, frase de síntese embaixo).

Caminho para começar (dado pelo próprio Code):
1. Gate 1 (auditoria só-leitura): ver o que já existe para DERIVAR "peso de
   evidência × grau de validação" por hipótese — os `vinculos` com `efeito` e o
   `status` da hipótese. Reportar e parar.
2. Confirmar a regra de posicionamento (peso = nº de vínculos `sustenta`;
   validação = `status` da hipótese) antes de desenhar.
3. Gate 2: construir o mapa da Zona 2 como piloto. Só leitura, sem schema novo.

Prompt de abertura sugerido para o Code:
```
Leia SPEC_MODELO_DADOS.md (Fase 5) e HANDOFF_SESSAO.md. Vamos construir o piloto
da Fase 5: Zona 2, mapa (a) evidência × validação. Gate 1: audite como derivar
peso-de-evidência e grau-de-validação por hipótese dos dados atuais (vinculos com
efeito, status). Reporte e pare — não escreva nada.
```

---

## 5. PENDÊNCIAS e PONTOS SOLTOS (não perder — conferir se estão no SPEC §5)

Itens que surgiram na sessão e devem estar registrados no backlog do SPEC.
Ao retomar, confirmar que cada um está lá; se faltar, adicionar:

- [ ] **Eixos da Zona 2:** decidido que serão DOIS mapas (evidência×validação E
      risco×retorno). Piloto é o primeiro; o segundo entra na sequência.
- [ ] **Card operacional vs patrimonial (Logístico):** o galpão no Logístico
      deveria mostrar campos operacionais (acesso, docas, pé-direito, área útil)
      em vez dos patrimoniais (avaliação fiscal). Registrado no §5. Refinamento.
- [ ] **Campo "categoria de dor" (Logístico):** para o ranking de dores agrupar
      sem depender de texto idêntico. Hoje é heurística; virar campo se provar
      valor. Conferir se foi registrado.
- [ ] **Heurística curto-prazo/hub (Logístico):** classificação por palavra-chave
      do `dorOportunidade`, sem persistir. Se provar valor, virar campo explícito.
- [ ] **Filtro de relevância (Logístico):** hoje deriva de heurística; avaliar
      campo explícito no futuro.
- [ ] **Âncora fiscal → valor de mercado:** substituir "avaliação fiscal" (venal,
      subvaloriza) por valor de mercado calculado via comparável (R$/m² × área).
      Depende da Zona 3 / cruzamento. Preservado no §5.
- [ ] **statusDominio derivado de texto:** a faixa de enfiteuse foi resolvida com
      campo explícito no Patrimonial. Avaliar se outros status de pilar (que hoje
      derivam de texto livre) precisam do mesmo tratamento.
- [ ] **Campo `titulo` opcional nas evidências:** só se o truncamento não bastar
      (provavelmente desnecessário).
- [ ] **Mapa do produto (case de portfólio):** diagrama + ORGANOGRAMA visual da
      modelagem de dados + fluxo diagnóstico→decisão + espinha de fases como
      histórico. NÃO vai dentro do app (onboarding já cobre o uso). Fundamentos de
      pesquisa a citar: Evidence Coverage Matrix (CHI 2026), decision quadrants
      (Decision Dashboard bayesiano), risk-reward grid 2×2. Munição de antes/depois
      já existe: card Patrimonial, linha de evidência, tabelão de comparáveis.
- [ ] **Multi-vínculo por evidência (UI):** o modelo já suporta uma evidência
      ligada a várias hipóteses com efeito; a UI atual mostra vínculo único.
      Backlog de UI.
- [ ] **Varredura de chats antigos:** buscar demandas combinadas em conversas
      anteriores que nunca entraram em SPEC (risco de itens perdidos).
- [ ] **Avaliar skill de captura de backlog:** só se a regra "registrar na mesma
      sessão" (SPEC §1.6) não bastar sozinha.

---

## 6. REGRAS DE TRABALHO (herdadas — manter)

- **Gates:** auditar (só leitura) → mostrar diff/amostra → pausar p/ aprovação →
  implementar → verificar backup. Nunca pular.
- **Aditivo e retrocompatível.** Nunca renomear field key. `0 ≠ vazio`.
- **App é live para a família.** Exportar backup antes de migração; push publica.
- **Nada sai do backlog** — adiar ≠ esquecer; só muda prioridade (SPEC §1.6).
- **Modelagem antes de UX** — evita retrabalho.
- **Honestidade do vazio** — mostrar o que não se sabe com o mesmo peso do que se
  sabe. É princípio central do dashboard.
- **Forma segue a pergunta** — no dashboard, elemento visual que não responde
  pergunta é decoração; sai.
- **Piloto primeiro** — uma frente/zona provada, depois replica. Não abrir tudo
  de uma vez.

---

## 7. AMBIENTE (lembretes práticos)

- Dev repo: `~/Área de trabalho/SAO_BORJA_HANDOFF/app` (Linux).
- Rodar local: `npm run dev` DENTRO da pasta do app (não em `/home/eddi`), ou o
  script `Abrir Holding.sh`. `localhost:5173` só abre com o servidor de pé.
- Publicado: GitHub Pages (`eddikochi/holding`) — sempre no ar, independe do
  servidor local.
- Fora do versionamento (locais, não commitar): `.claude/launch.json`,
  `AUTOPREENCHIMENTO_DESK.json`, `ABRIR MASTERPLAN.cmd`, `Abrir Holding.sh`.
- Backup: exportar JSON pela tela Backup antes de qualquer migração. Formato
  atual v9+ (com `codigo`/`codigoLegado`/`pilares`/`vinculos`).
