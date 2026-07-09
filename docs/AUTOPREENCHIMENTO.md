# Relatório de Auto-preenchimento (Desk) — a partir dos documentos do projeto

Data: 2026-07-09. Fonte: os 5 PDFs reconstruídos do projeto (Discovery, Benchmark, Mapeamento,
Relatório Completo, Estrutura Operacional).

## Como usar

O pré-preenchimento está no arquivo **`AUTOPREENCHIMENTO_DESK.json`** (raiz do projeto), no formato de
backup do app. Importe em **Backup → Importar backup**.

⚠️ **Importante:** a importação de backup **substitui** os dados atuais do navegador. Faça isso como
**ponto de partida**, ANTES de cadastrar/importar dados de campo. Depois, use "Importar dados de campo"
no modo **mesclar** para somar seus dados reais.

## Regra de proveniência aplicada (inegociável)

- Toda evidência entrou como **desk** (`fonte: pesquisa_desk`), com o **documento de origem** no detalhe.
- Confiança **no máximo média**; leituras interpretativas/estratégicas e itens futuros/especulativos = **baixa**.
- **Nenhuma hipótese foi marcada como validada** — documento gera evidência de contexto, não validação de
  mercado. Todas as 10 hipóteses estão como **não validada**. Validação exige campo.
- **Nenhum ativo/imóvel** foi criado (entram por import de campo ou cadastro manual).
- Os "players" pré-preenchidos são **perfis de segmento** derivados dos documentos (nome prefixado com
  "Segmento (perfil desk)"), **não são contatos reais** — servem para orientar quem procurar em campo.

## Resumo por pilar

| Pilar | Hipóteses | Evidências desk | Players (perfis) | Análise |
|-------|:---------:|:---------------:|:----------------:|:-------:|
| Logístico | 8 | 10 | 5 | SWOT + leitura executiva |
| Econômico | 1 | 4 | 0 | — |
| Jurídico | 0 | 2 | 0 | — |
| Imobiliário | 1 | 2 | 0 | — |
| Agroindustrial | 0 | 1 | 1 | — |
| Patrimonial | 0 | 0 | 0 | — |
| Turístico | 0 | 0 | 0 | — |
| Educação | 0 | 0 | 0 | — |
| **Total** | **10** | **19** | **6** | **1** |

Distribuição de confiança das evidências: **13 média · 6 baixa** (nenhuma alta, por regra).

## Detalhe por pilar

### Logístico (o mais rico)
- **Hipóteses (8, não validadas):** demanda reprimida por armazenagem flexível; pequenos operadores
  precisam de apoio; transportadoras com overflow/espera/transbordo; cross docking leve; fulfillment de
  ecommerce regional; armazenagem temporária/overflow sazonal; baixa digitalização (diferenciação);
  demanda binacional futura. Critério de validação anexado a cada uma.
- **Evidências desk (10):** tese estratégica, GAP analysis, benchmark regional (Uruguaiana/Foz/São Borja),
  MVP "espaço logístico flexível modular", 6 modelos de monetização, dores de transportadoras, matriz
  competitiva (baixa), riscos críticos, baixa digitalização, potencial binacional (baixa).
  Fontes: Discovery, Benchmark, Relatório Completo.
- **Players (perfis de segmento, 5):** Transportadoras, Empresas locais, Ecommerce regional, Despachantes/
  fronteira, Empresas argentinas — cada um com a dor documentada e vinculado a uma hipótese.
- **Análise:** SWOT completo + leitura executiva + recomendações (do Benchmark/Relatório), marcada como
  leitura de gabinete a validar em campo.

### Econômico
- **1 hipótese:** contexto de fronteira sustenta demanda por apoio ao fluxo aduaneiro.
- **4 evidências:** posição de fronteira (Ponte Internacional da Integração/Santo Tomé, corredor Mercosul);
  mercado pouco explorado em digitalização; tendências macro (baixa); ameaças de contexto (baixa).

### Jurídico
- **2 evidências:** lista de itens regulatórios a validar (zoneamento, licenciamento, bombeiros, Receita
  Federal, seguros, CNAEs, operação de fronteira, compliance); risco de confundir operação simples com
  alfandegada. Fontes: Mapeamento, Relatório.

### Imobiliário
- **1 hipótese:** locação flexível/multiuso pode render melhor que uso único.
- **2 evidências:** modelo de galpão multiuso; roteiro de pesquisa imobiliária a fazer.

### Agroindustrial
- **1 player (perfil):** Produtor rural; **1 evidência:** agro citado como segmento de demanda (baixa).

## Campos importantes que ficaram VAZIOS (viram lista de pesquisa desk/campo)

Os documentos **não trazem números**, então nada foi inventado:

- **Patrimonial:** nenhum ativo real nos docs → cadastrar o galpão e demais imóveis por import de campo/
  manual; preencher metragem, pé-direito, docas, coordenadas, estado físico.
- **Jurídico:** o checklist (matrícula, inventário, sucessão…) vive dentro de cada ativo → só é preenchível
  após cadastrar o ativo real, com advogado.
- **Imobiliário:** **sem R$/m²** nos docs → pesquisar comparáveis (aluguel de galpões/storage/comercial/
  coworking) em campo/desk e lançar no módulo 03.
- **Econômico:** **sem dados demográficos/PIB/incentivos numéricos** → buscar no IBGE/prefeitura com fonte.
- **Logístico:** dores documentadas são de segmento (não de empresas reais) → entrevistar players reais em
  campo para gerar evidências de campo e mover as hipóteses para parcial/validada.
- **Agroindustrial:** só menção de segmento → mapear produtores/cooperativas reais e a sazonalidade local.
- **Turístico e Educação:** **estes documentos não cobrem** esses pilares → pesquisa própria. (As hipóteses
  iniciais de Educação já estão disponíveis no app, pela aba Discovery do pilar, botão "hipóteses sugeridas".)

## Verificação

Backup validado (integridade de referências, tudo desk, confiança ≤ média, 0 hipóteses validadas) e
**importado com sucesso pela via real do app** (Backup → restaurar): o funil do Logístico mostra 8
hipóteses / 5 com evidência / 0 validadas; console limpo. Nenhuma mudança de schema/componentes — só dados.
