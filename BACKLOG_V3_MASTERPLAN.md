# BACKLOG v3 — Masterplan São Borja (registro, não executar agora)

Itens conscientemente adiados para depois do São Borja rodar em campo com dados reais.
Motivo geral: nada aqui impede preencher e usar o app agora. Fazer qualquer um destes antes
da primeira rodada de campo é adicionar estrutura sem validar a que já existe.

## v3.1 — Deploy seguro para a família
- Publicar o app no Cloudflare Pages.
- Proteger com Cloudflare Access (autenticação real por e-mail na frente do app), liberando os
  e-mails do usuário, do pai e do irmão.
- Isso substitui a ideia de "tela de senha no HTML", que seria segurança falsa (senha em JS é
  legível por qualquer um via DevTools) e não resolve o compartilhamento.
- Não requer código de autenticação no app — é configuração de infraestrutura no deploy.

## v3.2 — Multiusuário / dados compartilhados (avaliar necessidade real)
- Só faz sentido SE, na prática, pai e irmão precisarem editar dados e ver as edições um do outro.
- Isso quebra o local-first e exige backend real (sync, resolução de conflito). É um projeto à parte.
- Antes de construir: validar se o uso real não é resolvido apenas por (a) Access + (b) um único
  detentor dos dados que exporta/compartilha o JSON quando necessário.

## v3.3 — Generalização: plataforma de discovery configurável (SEMENTE)
- Ideia: transformar o app de "ferramenta do Masterplan São Borja" em base reutilizável para
  apoiar discovery de QUALQUER produto/projeto, trocando apenas o conteúdo (pilares, perguntas
  de onboarding, roteiros de entrevista, tipos de players, hipóteses) sem mexer na estrutura.
- Mecanismo provável: extrair todo o conteúdo hoje hardcoded para um "pacote de configuração"
  (JSON/schema) que define um projeto. O app carrega o pacote e se adapta.
- Primeiro caso de teste alternativo já identificado: projeto com uma veterinária — dor de
  rastreio da evolução de diagnósticos de pets ao longo do tempo. Estrutura de discovery
  (hipótese → evidência → validação) serve; muda o conteúdo.
- POR QUE ESPERAR: só se sabe o que generalizar depois de usar a ferramenta de ponta a ponta numa
  viagem real. Generalizar no abstrato extrai as variáveis erradas. O São Borja é o caso que
  prova o modelo; a vet é o caso que testa a generalização — nessa ordem.

## Provável v3 também (da análise de uso)
- Gráficos (Recharts) nos módulos de análise — só quando houver dado suficiente para um gráfico
  dizer algo.
- Visão cronograma/linha do tempo no Roadmap (hoje só kanban).
- Aplicação da identidade visual (KV) da holding via design tokens, quando a identidade estiver pronta.
