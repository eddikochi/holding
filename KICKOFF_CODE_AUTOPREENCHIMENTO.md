# KICKOFF — AUTO-PREENCHIMENTO A PARTIR DOS DOCUMENTOS — cole no Claude Code

Objetivo: pré-preencher o app com o que JÁ existe nos documentos do projeto (PDFs de logística, benchmark, discovery, masterplan e demais materiais na pasta/repositório), economizando digitação manual antes do preenchimento de campo.

## Regra inegociável de proveniência

TUDO que você preencher a partir de documento deve entrar marcado como:
- fonte: nome do documento de origem (ex: "Discovery_Operacional_Completo_SaoBorja_v2");
- tipo de evidência: "desk" (pesquisa documental), nunca "campo";
- grau de confiança: no máximo "médio". Suposições ou leituras interpretativas = "baixo".

NENHUMA hipótese pode ser marcada como "validada" a partir de documento. Documento gera evidência de contexto, não validação de mercado — validação exige dado de campo. Se um doc sugere que uma hipótese é promissora, isso é evidência desk de confiança média, e a hipótese permanece "não validada" ou "parcial", nunca "validada".

## O que fazer

1. Leia todos os documentos disponíveis na pasta do projeto e no repositório.
2. Para cada pilar, identifique o que os documentos já respondem e pré-preencha:
   - Hipóteses (enunciado + critérios de validação) quando o doc as define;
   - Evidências desk vinculadas a essas hipóteses, com a fonte citada;
   - Tipos de players / segmentos já mapeados nos docs;
   - Dados de diagnóstico já levantados (ex: benchmark logístico, gaps de mercado, tese do hub, MVP recomendado);
   - Campos de contexto econômico/regional que os docs tragam COM fonte.
3. Onde o documento traz um número ou afirmação factual, registre o número E a fonte. Onde não há fonte confiável, NÃO invente — deixe o campo vazio e, se útil, registre como pergunta aberta a validar em campo.
4. O pilar Logística é o mais rico em documentos — espere preencher bastante ali (hipóteses do hub, players, dores, benchmark, MVP). Os demais pilares terão menos; preencha só o que os docs sustentarem.

## O que NÃO fazer

- Não inventar dados para preencher campos vazios "para ficar completo". Campo sem fonte fica vazio.
- Não marcar nada como validado.
- Não criar ativos/imóveis fictícios — os ativos reais entram pelo import do JSON de campo ou cadastro manual do usuário.
- Não alterar estrutura, schema ou componentes. Esta tarefa é APENAS popular dados.

## Entrega

- Ao final, gere um relatório em docs/AUTOPREENCHIMENTO.md listando: por pilar, o que foi preenchido, de qual documento veio, e quais campos importantes ficaram vazios por falta de fonte (isso vira lista de pesquisa desk/campo).
- Commit descritivo. Não altere CHANGELOG de features (isto é dado, não feature) — registre no relatório.
- Me apresente um resumo de quantas hipóteses, evidências e players foram pré-preenchidos por pilar.
