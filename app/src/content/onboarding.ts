/**
 * Textos de onboarding dos 7 diagnósticos (01–07). PT-BR direto e didático.
 * Regra do projeto: separar CAMPO (presencial em São Borja, ~3x/ano) de
 * DESK (pesquisável de Porto Alegre). Nunca apresentar hipótese como fato.
 */

export interface OnboardingModulo {
  oQueResponde: string;
  porQueImporta: string;
  coletarCampo: string[];
  coletarDesk: string[];
  checklist: string[];
  criterioPronto: string[];
}

export const ONBOARDING: Record<string, OnboardingModulo> = {
  patrimonial: {
    oQueResponde: 'O que a família tem, exatamente? Este é o inventário dos ativos físicos — galpão, terrenos, loja, oficina e outros imóveis — com uma ficha completa de cada um: onde fica, tamanho, estado e potencial.',
    porQueImporta: 'Você não decide o que fazer com um patrimônio que não conhece por inteiro. Antes de qualquer negócio, cada ativo precisa estar mapeado. É a base que todos os outros diagnósticos usam.',
    coletarCampo: [
      'Medir metragem (terreno e construído) e pé-direito de cada imóvel',
      'Fotografar estado físico: cobertura, piso, estrutura, instalações',
      'Anotar a localização exata (ponto no mapa / coordenadas)',
      'Observar acessos, vizinhança e uso atual de cada ativo',
    ],
    coletarDesk: [
      'Conferir endereços e número de matrícula de cada imóvel',
      'Levantar plantas ou croquis existentes',
      'Registrar quem usa/ocupa cada ativo hoje',
    ],
    checklist: [
      'Todos os ativos da família listados',
      'Cada ativo com tipo, endereço e metragem',
      'Estado físico descrito por ativo',
      'Coordenadas preenchidas (para o mapa)',
      'Potencial por pilar anotado em cada ativo',
    ],
    criterioPronto: [
      'Nenhum imóvel da família falta no inventário',
      'Cada ativo tem tipo, endereço e estado físico',
      'Dá para abrir o mapa e ver todos plotados',
    ],
  },
  juridico: {
    oQueResponde: 'Qual a situação legal de cada ativo? Matrícula em ordem? Inventário concluído? Sucessão resolvida? Aqui fica o checklist jurídico de todos os imóveis, item a item.',
    porQueImporta: 'Uma pendência jurídica trava qualquer projeto. Descobrir isso antes de investir economiza tempo e dinheiro. Importante: este app organiza a informação, mas não substitui o parecer de um advogado.',
    coletarCampo: [
      'Recolher com a família documentos guardados (escrituras, contratos, IPTU)',
    ],
    coletarDesk: [
      'Puxar a matrícula atualizada de cada imóvel no cartório de registro',
      'Verificar situação de inventário e sucessão dos bens',
      'Checar zoneamento e uso permitido na prefeitura',
      'Levantar licenciamento, situação ambiental e tributária',
      'Anotar o que o advogado/contador orientou em cada consulta',
    ],
    checklist: [
      'Os 9 itens do checklist avaliados em cada ativo',
      'Pendências com responsável e prazo definidos',
      'Matrícula de cada imóvel conferida',
      'Prós e contras de holding/SPE anotados após consulta',
    ],
    criterioPronto: [
      'Cada ativo com os 9 itens jurídicos classificados',
      'Toda pendência tem responsável e prazo',
      'Decisão sobre holding/SPE embasada em parecer profissional',
    ],
  },
  imobiliario: {
    oQueResponde: 'Quanto valem e como podem ser usados os imóveis? Compara com o mercado local (R$/m²) e desenha cenários de uso: alugar como está, reformar, desenvolver ou vender.',
    porQueImporta: 'O melhor uso de um imóvel raramente é o óbvio. Comparar com o mercado e pensar cenários evita deixar dinheiro na mesa — ou investir onde não paga.',
    coletarCampo: [
      'Conversar com corretores locais sobre preços praticados',
      'Observar imóveis semelhantes à venda/aluguel na região',
    ],
    coletarDesk: [
      'Pesquisar anúncios (portais e imobiliárias) de imóveis comparáveis',
      'Registrar m², preço pedido, aluguel e a fonte de cada comparável',
      'Estimar custo de reforma/retrofit por cenário',
    ],
    checklist: [
      'Ao menos 3 comparáveis por tipo de imóvel, com fonte',
      'R$/m² médio calculado por tipo',
      'Cenários de uso preenchidos para cada ativo',
      'Prós e contras de cada cenário anotados',
    ],
    criterioPronto: [
      'Comparáveis suficientes para uma média confiável de R$/m²',
      'Cada ativo com pelo menos um cenário de uso avaliado',
      'Todo número de mercado tem fonte registrada',
    ],
  },
  economico: {
    oQueResponde: 'Como está a economia de São Borja e da fronteira? Reúne dados demográficos e econômicos, incentivos municipais/estaduais e o contexto do comércio Brasil–Argentina.',
    porQueImporta: 'Uma oportunidade só existe dentro de um contexto econômico. Separar fato de especulação aqui evita construir um plano sobre suposição.',
    coletarCampo: [
      'Ouvir comerciantes e lideranças locais sobre o movimento da cidade',
      'Observar o fluxo na fronteira e nos pontos de comércio',
    ],
    coletarDesk: [
      'Buscar dados de população e economia no IBGE (com ano e fonte)',
      'Mapear incentivos municipais e estaduais vigentes',
      'Levantar dados oficiais sobre o corredor bioceânico',
      'Registrar cada número com a fonte e a data — nunca inventar',
    ],
    checklist: [
      'Principais indicadores da região registrados com fonte',
      'Incentivos municipais/estaduais mapeados',
      'Contexto do corredor bioceânico separado em fato vs. especulação',
    ],
    criterioPronto: [
      'Indicadores-chave da região com fonte e data',
      'Incentivos aplicáveis identificados',
      'Nenhum número sem fonte apresentado como fato',
    ],
  },
  logistico: {
    oQueResponde: 'Existe demanda real por um espaço logístico flexível em São Borja? Este é o pilar mais maduro: diagnóstico do galpão, players logísticos, dores recorrentes e o funil hipótese → evidência → validação do Hub.',
    porQueImporta: 'O Hub Logístico é a tese mais desenvolvida — mas tese não é fato. Aqui você acompanha se as evidências de campo confirmam ou derrubam cada hipótese, antes de investir.',
    coletarCampo: [
      'Entrevistar transportadoras, despachantes e empresas locais',
      'Anotar a dor de cada um e quanto pagariam por uma solução',
      'Diagnosticar o galpão: docas, pé-direito, acessos, fluxo de caminhões',
      'Observar o movimento na ponte e nos pátios da fronteira',
    ],
    coletarDesk: [
      'Levantar volume e sazonalidade do fluxo de fronteira',
      'Mapear concorrentes e soluções logísticas já existentes',
    ],
    checklist: [
      'Players logísticos entrevistados e cadastrados',
      'Dores ranqueadas por frequência',
      'Hipóteses do Hub cadastradas',
      'Evidências vinculadas a cada hipótese',
      'Cada hipótese com status atualizado (aba Discovery)',
    ],
    criterioPronto: [
      'Dá para ver o funil hipótese→evidência→validação com dados reais',
      'As hipóteses principais têm evidência suficiente para decidir',
      'Diagnóstico do galpão preenchido',
    ],
  },
  agroindustrial: {
    oQueResponde: 'O agro da região precisa de quê? Mapeia produtores e demandas de armazenagem, beneficiamento e serviços, com a sazonalidade do calendário agrícola.',
    porQueImporta: 'O agro é o motor econômico da fronteira. Entender o ciclo e as dores do produtor revela oportunidades que o galpão pode atender fora do pico do Hub logístico.',
    coletarCampo: [
      'Visitar cooperativas, produtores e agroindústrias',
      'Anotar demandas de armazenagem, beneficiamento e serviços',
      'Levantar os meses de pico e de baixa de cada cultura',
    ],
    coletarDesk: [
      'Consultar o calendário de safra das principais culturas locais',
      'Identificar possíveis parcerias no setor',
    ],
    checklist: [
      'Players do agro mapeados',
      'Demandas registradas com a fonte',
      'Calendário de sazonalidade preenchido',
      'Possíveis parcerias anotadas',
    ],
    criterioPronto: [
      'Principais players do agro mapeados',
      'Sazonalidade anual esboçada',
      'Demandas concretas identificadas com fonte',
    ],
  },
  turistico: {
    oQueResponde: 'Há potencial turístico ligado às Missões, ao patrimônio histórico, à Guerra do Paraguai e à identidade local? Inventaria atrativos e ideias de experiência/conteúdo.',
    porQueImporta: 'Turismo e história têm valor, mas seguem uma lógica diferente dos outros pilares. Este tende a virar um projeto à parte — registre aqui sem misturar com a decisão de investimento dos demais.',
    coletarCampo: [
      'Visitar e fotografar os atrativos históricos e culturais',
      'Observar o movimento de visitantes nos pontos principais',
    ],
    coletarDesk: [
      'Buscar dados oficiais de fluxo turístico (com fonte)',
      'Levantar calendário de eventos e roteiros regionais',
      'Reunir ideias de experiência e conteúdo audiovisual',
    ],
    checklist: [
      'Atrativos inventariados',
      'Fluxo turístico estimado, com a fonte',
      'Ideias de experiência/conteúdo registradas',
      'Pilar marcado como projeto separado',
    ],
    criterioPronto: [
      'Inventário de atrativos montado',
      'Estimativas de fluxo com fonte (ou marcadas como a confirmar)',
      'Registro mantido separado da priorização dos demais pilares',
    ],
  },
};
