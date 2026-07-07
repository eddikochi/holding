/**
 * Textos de onboarding dos 12 módulos. Autor: content-writer.
 * Tom direto, PT-BR, sem jargão. Fase 1: onboarding placeholder por módulo —
 * o "porquê" já real; os formulários de dados chegam nas fases seguintes.
 */

export interface OnboardingModulo {
  oQueResponde: string;
  porQueImporta: string;
  ondeColetar: string;
  criterioPronto: string;
}

export const ONBOARDING: Record<string, OnboardingModulo> = {
  patrimonial: {
    oQueResponde: 'O que a família tem, exatamente? Este módulo é o inventário dos ativos físicos — galpão, terrenos, loja, oficina e outros imóveis — com ficha completa de cada um.',
    porQueImporta: 'Você não decide o que fazer com um patrimônio que não conhece por inteiro. Antes de qualquer negócio, é preciso ter cada ativo mapeado: onde fica, tamanho, estado e potencial.',
    ondeColetar: 'Campo (medições, fotos, estado físico) e desk (matrículas, endereços). Os ativos que você já cadastrou na ferramenta de campo entram aqui pelo import.',
    criterioPronto: 'Todos os ativos da família cadastrados, cada um com tipo, endereço e estado físico preenchidos.',
  },
  juridico: {
    oQueResponde: 'Qual a situação legal de cada ativo? Matrícula em ordem? Inventário concluído? Sucessão resolvida? Este módulo consolida o checklist jurídico de todos os imóveis.',
    porQueImporta: 'Uma pendência jurídica trava qualquer projeto. Descobrir isso antes de investir economiza tempo e dinheiro. Atenção: este app organiza informação, mas não substitui o parecer de um advogado.',
    ondeColetar: 'Desk (documentos, cartório) e consulta com advogado. Anote aqui o que cada consulta revelou.',
    criterioPronto: 'Cada ativo com os 9 itens do checklist jurídico avaliados e as pendências com responsável e prazo.',
  },
  imobiliario: {
    oQueResponde: 'Quanto valem e como podem ser usados os imóveis? Compara com o mercado local e desenha cenários de uso: alugar como está, reformar, desenvolver ou vender.',
    porQueImporta: 'O melhor uso de um imóvel raramente é o óbvio. Comparar com o mercado e pensar cenários evita deixar dinheiro na mesa — ou investir onde não paga.',
    ondeColetar: 'Desk (anúncios, imobiliárias, R$/m² da região) e campo (conversa com corretores). Todo número precisa de fonte e data.',
    criterioPronto: 'Comparáveis de mercado registrados com fonte, e ao menos um cenário de uso por ativo.',
  },
  economico: {
    oQueResponde: 'Como está a economia de São Borja e da fronteira? Reúne dados demográficos, incentivos municipais/estaduais e o contexto do comércio Brasil–Argentina.',
    porQueImporta: 'Uma oportunidade só existe dentro de um contexto econômico. Separar fato de especulação aqui evita construir um plano sobre suposição.',
    ondeColetar: 'Desk (IBGE, prefeitura, notícias) e dados oficiais. Nunca invente um número — registre a fonte e a data de cada dado.',
    criterioPronto: 'Principais indicadores econômicos da região registrados com fonte, e incentivos mapeados.',
  },
  logistico: {
    oQueResponde: 'Existe demanda real por um espaço logístico flexível em São Borja? Este é o pilar mais maduro: diagnóstico do galpão, players logísticos, dores recorrentes e o funil hipótese → evidência → validação do Hub.',
    porQueImporta: 'O Hub Logístico é a tese mais desenvolvida — mas tese não é fato. Aqui você acompanha se as evidências de campo confirmam ou derrubam a hipótese, antes de investir.',
    ondeColetar: 'Campo (entrevistas com transportadoras, despachantes, empresas locais) e desk (fluxo de fronteira). A ferramenta de campo do Hub alimenta este módulo pelo import.',
    criterioPronto: 'Players entrevistados, dores ranqueadas e cada hipótese do Hub com seu status baseado em evidências.',
  },
  agroindustrial: {
    oQueResponde: 'O agro da região precisa de quê? Mapeia produtores e demandas de armazenagem, beneficiamento e serviços, com a sazonalidade do calendário agrícola.',
    porQueImporta: 'O agro é o motor econômico da fronteira. Entender o ciclo e as dores do produtor revela oportunidades que o galpão pode atender fora da alta do Hub logístico.',
    ondeColetar: 'Campo (cooperativas, produtores, agroindústrias) e desk (calendário de safra). ',
    criterioPronto: 'Players do agro mapeados, demandas registradas e a sazonalidade anual esboçada.',
  },
  turistico: {
    oQueResponde: 'Há potencial turístico ligado às Missões, ao patrimônio histórico e à identidade local? Inventaria atrativos e ideias de experiência.',
    porQueImporta: 'Turismo e história têm valor, mas seguem uma lógica diferente dos outros pilares. Este módulo tende a virar um projeto à parte — registre aqui sem misturar com a decisão de investimento dos demais.',
    ondeColetar: 'Campo (atrativos, fluxo observado) e desk (dados de turismo com fonte).',
    criterioPronto: 'Atrativos inventariados e ideias registradas — mantendo este pilar separado da priorização principal.',
  },
  oportunidades: {
    oQueResponde: 'Quais negócios concretos surgem dos diagnósticos? Lista mestre de oportunidades, criadas à mão ou promovidas a partir de hipóteses validadas.',
    porQueImporta: 'É aqui que o diagnóstico vira candidato a decisão. Cada oportunidade carrega as hipóteses e evidências que a sustentam — nada entra por palpite.',
    ondeColetar: 'Trabalho de análise em Porto Alegre, cruzando os dados coletados em campo.',
    criterioPronto: 'Oportunidades listadas com pilares, hipóteses ligadas e notas de impacto/investimento/risco/esforço.',
  },
  priorizacao: {
    oQueResponde: 'Por onde começar? Ordena as oportunidades por impacto, investimento e risco, e as posiciona numa matriz de esforço.',
    porQueImporta: 'Recursos são finitos. Priorizar com critério transparente evita perseguir a aposta mais chamativa em vez da mais sensata.',
    ondeColetar: 'Análise, a partir das oportunidades do módulo 08.',
    criterioPronto: 'Oportunidades posicionadas na matriz e ranqueadas; as melhores promovidas a business case.',
  },
  'business-cases': {
    oQueResponde: 'A oportunidade se paga? Aprofunda as prioritárias com modelo de negócio, CAPEX/OPEX, receitas, payback simplificado e cenários.',
    porQueImporta: 'Antes de comprometer capital, é preciso ver os números — com cada premissa à mostra. Transparência acima de sofisticação: todo número tem a sua fonte ao lado.',
    ondeColetar: 'Análise, com premissas fundamentadas nos diagnósticos.',
    criterioPronto: 'Cada business case com números, fontes e uma decisão registrada: seguir, não seguir ou aguardar.',
  },
  roadmap: {
    oQueResponde: 'Quando cada coisa acontece? Organiza tarefas e marcos por horizonte (0–12 meses, 1–3, 3–5, 5–10 anos), com dependências.',
    porQueImporta: 'Um plano sem sequência e sem prazos é só uma lista de desejos. O roadmap transforma decisões em passos com ordem.',
    ondeColetar: 'Análise, a partir dos business cases aprovados.',
    criterioPronto: 'Tarefas e marcos distribuídos por horizonte, com responsáveis e dependências visíveis.',
  },
  governanca: {
    oQueResponde: 'Quem decide o quê, e como as decisões ficam registradas? Papéis familiares, modelo decisório, ritos, o Decision Log completo e os KPIs do projeto.',
    porQueImporta: 'Patrimônio de família precisa de regras de decisão claras para não travar em conflito. E toda decisão importante fica registrada aqui — com o porquê e as evidências que a embasaram.',
    ondeColetar: 'Conversas em família e o acúmulo de decisões ao longo do projeto.',
    criterioPronto: 'Papéis e modelo decisório definidos, Decision Log em uso e KPIs sendo acompanhados.',
  },
};
