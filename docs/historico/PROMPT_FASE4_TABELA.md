# PROMPT — Fase 4.1 + 4.2 (padrão de tabela + piloto Imobiliário)

F3 aprovada e testada. Seguir para a Fase 4 do SPEC_MODELO_DADOS.md.
Itens 4.1 (definir o padrão de tabela) e 4.2 (aplicar no Imobiliário) juntos —
o comparativo do Imobiliário É o piloto do padrão.

## PADRÃO DE TABELA (definido e aprovado — item 4.1)

Regras replicáveis para toda tabela densa da aba Dados de qualquer pilar:

1. **A métrica derivada é a coluna principal.** A tabela existe para produzir um
   número — esse número é coluna, não cálculo escondido. Nos comparáveis: `R$/m²`
   (= aluguelMensal / m2). Não existe hoje na tela; é a razão de ser da tabela.
2. **Ordenar pela métrica derivada** (ascendente), com **linha de referência da
   mediana** marcada visualmente entre as linhas.
3. **Números alinhados à direita**, `font-variant-numeric: tabular-nums`.
4. **Coluna vazia sai.** Auditar preenchimento; se um campo está vazio em ~todos
   os registros, não vira coluna (vai para o detalhe/editar).
5. **Metadado vira inline discreto** — fonte/origem junto ao nome em texto menor
   e apagado, não coluna própria.
6. **Ações (Editar/excluir) discretas** — aparecem no hover da linha; em mobile,
   acessíveis mas sem ocupar largura fixa. Hoje consomem ~20% da tabela.
7. **Registros incompletos ficam separados**, em bloco recolhido no rodapé
   ("N sem m² — não entram no cálculo"), para não poluir a comparação nem
   distorcer a mediana.
8. **Agrupar por tipo quando os grupos têm realidades distintas** — cada grupo
   com seu próprio cabeçalho e sua própria mediana.

## APLICAÇÃO — comparáveis do Imobiliário (item 4.2)

Dados reais (16 comparáveis, conferidos no backup):
- Galpões: 7 registros, 6 com m² → mediana **R$ 14,04/m²** (min 2,50 · max 20,00)
- Lojas: 9 registros, 5 com m² → mediana **R$ 20,52/m²** (min 8,79 · max 40,00)
- 5 registros sem m² (1 galpão + 4 lojas) → bloco separado, fora do cálculo
- Campo `preco`/"PREÇO": vazio em 16/16 → remover da tabela

Estrutura por grupo (galpões, depois lojas):
- Cabeçalho do grupo: tipo + contagem + **mediana R$/m² em destaque à direita**
- Colunas: **Imóvel** (descricao + fonte inline discreto) · **m²** · **Aluguel** ·
  **R$/m²** (ênfase, peso maior)
- Linha tracejada de mediana posicionada entre os registros abaixo e acima dela
- Rodapé recolhível com os registros sem m²

## REGRAS
- Só UI/leitura. **Sem mudança de schema, sem migração.** R$/m² é derivado em
  render, não persistido.
- `0 ≠ vazio`: registro sem m² não calcula (não vira 0), vai para o bloco separado.
- Mobile-first: em tela estreita a tabela não pode gerar scroll horizontal —
  reflui (ex.: m²/aluguel em linha secundária, R$/m² preservado à direita).
- Mediana calculada só sobre registros com m² preenchido.
- Não tocar em Logístico/Jurídico/Econômico nesta etapa — replicação vem depois,
  um pilar por vez.

## GATES
**Gate 1 — auditoria (só leitura, NÃO escreva):** localizar o componente da tabela
de comparáveis, listar as colunas atuais, confirmar o campo de preço vazio e como
`tipo` está normalizado. Reportar e PAUSAR.

**Gate 2 — implementação:** aplicar o padrão. Extrair a lógica de tabela em algo
reaproveitável pelos outros pilares (o padrão precisa ser replicável, não copiado).
PARAR para teste manual.

**Gate 3:** backup íntegro; confirmar que nenhum comparável sumiu ou teve dado alterado.

## CRITÉRIO DE PRONTO
Abro o Imobiliário → aba Dados e vejo, em segundos, quanto custa o m² de galpão e
de loja em São Borja, quem está acima e abaixo da mediana, sem ler linha por linha.
Nenhum dado perdido. Padrão documentado e reaproveitável para os outros pilares.
