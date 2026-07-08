/**
 * Configuração de discovery por pilar. Autor: content-writer (guidelines aplicadas).
 * - perguntasMestre: o enquadramento da investigação ("o que estamos tentando descobrir").
 * - tiposPlayers: quem procurar em campo e a dor/oportunidade a investigar em cada um.
 * - roteiro: perguntas de entrevista mostradas ao registrar um stakeholder.
 * Fontes: SPEC.md, skill masterplan-domain e material de Discovery do projeto (Logística).
 */
import type { Pilar } from '../models/types';

export interface TipoPlayer {
  tipo: string;
  investigar: string;
}
export interface PilarDiscovery {
  perguntasMestre: string[];
  tiposPlayers: TipoPlayer[];
  roteiro: string[];
  /** Hipóteses sugeridas do pilar, adicionáveis com um clique (editáveis depois). */
  hipotesesIniciais?: string[];
}

export const DISCOVERY_PILAR: Record<Pilar, PilarDiscovery> = {
  logistico: {
    perguntasMestre: [
      'Quem realmente possui dor logística na região?',
      'Quais dores aparecem repetidamente?',
      'Quais dores já geram perda financeira?',
      'Quais geram urgência?',
      'Quem já estaria disposto a pagar ou investir?',
      'Qual solução exige menor investimento inicial?',
      'Qual tem maior recorrência?',
      'Qual modelo pode crescer de forma modular?',
    ],
    tiposPlayers: [
      { tipo: 'Transportadora', investigar: 'Overflow, espera, transbordo, armazenagem curta' },
      { tipo: 'Empresa local', investigar: 'Estoque, sazonalidade, armazenagem terceirizada' },
      { tipo: 'Ecommerce regional', investigar: 'Fulfillment, embalagem, separação, mini estoque' },
      { tipo: 'Despachante / fronteira', investigar: 'Gargalos operacionais aduaneiros' },
      { tipo: 'Empresa argentina', investigar: 'Demanda por apoio operacional no lado brasileiro' },
    ],
    roteiro: [
      'Qual a maior dificuldade logística hoje?',
      'Onde vocês perdem mais tempo?',
      'Existe problema de espaço? E de estoque?',
      'Existe gargalo operacional?',
      'Existe dificuldade com transportadoras?',
      'Existe dificuldade operacional de fronteira?',
      'Existe sazonalidade?',
      'Que serviço ajudaria mais hoje?',
      'Quanto uma solução desse tipo valeria? (registre em "valor citado")',
      'Usariam um espaço logístico flexível se existisse?',
    ],
  },
  patrimonial: {
    perguntasMestre: [
      'Quais ativos a família realmente possui e em que estado?',
      'Qual ativo está subutilizado hoje?',
      'Qual tem o maior potencial ocioso?',
      'Onde há risco (estrutural, ocupação, abandono)?',
      'Qual ativo pede decisão mais urgente?',
    ],
    tiposPlayers: [
      { tipo: 'Familiar / coproprietário', investigar: 'Uso atual, expectativa e restrições sobre cada bem' },
      { tipo: 'Ocupante / inquilino', investigar: 'Condições de uso e ocupação atual' },
      { tipo: 'Vizinho / entorno', investigar: 'Contexto e uso da vizinhança' },
    ],
    roteiro: [
      'Que ativos da família existem e onde ficam?',
      'Quem usa ou ocupa cada um hoje?',
      'Qual o estado físico de cada imóvel?',
      'Algum está gerando custo sem retorno?',
      'Qual você acha que tem mais potencial parado?',
    ],
  },
  juridico: {
    perguntasMestre: [
      'Quais ativos têm situação legal resolvida e quais não?',
      'Onde há pendência que trava qualquer negócio?',
      'O que exige inventário ou acerto de sucessão?',
      'Que decisões dependem de parecer profissional?',
      'Holding/SPE faz sentido para este patrimônio?',
    ],
    tiposPlayers: [
      { tipo: 'Advogado', investigar: 'Situação de matrícula, inventário, sucessão, riscos' },
      { tipo: 'Contador', investigar: 'Tributação, viabilidade de holding/SPE' },
      { tipo: 'Cartório / prefeitura', investigar: 'Registro, zoneamento, licenciamento' },
    ],
    roteiro: [
      'A matrícula deste imóvel está regular e atualizada?',
      'O inventário/sucessão está concluído?',
      'Há alguma pendência tributária ou ambiental?',
      'O uso pretendido é permitido pelo zoneamento?',
      'Uma holding/SPE traria vantagem no nosso caso? Quais custos?',
    ],
  },
  imobiliario: {
    perguntasMestre: [
      'Quanto valem os imóveis no mercado atual?',
      'Qual o melhor uso de cada ativo?',
      'Alugar como está, reformar, desenvolver ou vender?',
      'Onde há demanda de locação/compra não atendida?',
      'Qual cenário paga o investimento mais rápido?',
    ],
    tiposPlayers: [
      { tipo: 'Corretor / imobiliária', investigar: 'Preços praticados, R$/m², velocidade de venda/locação' },
      { tipo: 'Investidor local', investigar: 'Apetite por desenvolvimento e parcerias' },
      { tipo: 'Locatário potencial', investigar: 'Que tipo de imóvel procura e a que preço' },
    ],
    roteiro: [
      'Quanto custa comprar/alugar um imóvel parecido na região?',
      'Qual o R$/m² praticado por aqui?',
      'Que tipo de imóvel tem mais procura?',
      'Vale mais reformar ou usar como está?',
      'Existe demanda que ninguém está atendendo?',
    ],
  },
  economico: {
    perguntasMestre: [
      'Como está a economia de São Borja e da fronteira?',
      'Quais setores crescem e quais encolhem?',
      'Que incentivos municipais/estaduais existem?',
      'O corredor bioceânico muda o jogo — e o que é fato vs. especulação?',
      'Onde o dinheiro circula na cidade?',
    ],
    tiposPlayers: [
      { tipo: 'Comerciante local', investigar: 'Movimento, sazonalidade, dores do comércio' },
      { tipo: 'Associação / sindicato', investigar: 'Panorama do setor e demandas coletivas' },
      { tipo: 'Poder público', investigar: 'Incentivos, projetos e dados oficiais' },
    ],
    roteiro: [
      'Como está o movimento do comércio na cidade?',
      'Que setores estão crescendo?',
      'Existe algum incentivo público sendo usado?',
      'O que se comenta sobre o corredor bioceânico? É concreto?',
      'Onde você vê dinheiro circulando ou faltando?',
    ],
  },
  agroindustrial: {
    perguntasMestre: [
      'Quem são os produtores e agroindústrias da região?',
      'Que demandas de armazenagem/beneficiamento existem?',
      'Qual a sazonalidade que define o ano?',
      'Onde o produtor perde valor por falta de estrutura?',
      'Que parcerias são possíveis?',
    ],
    tiposPlayers: [
      { tipo: 'Produtor rural', investigar: 'Armazenagem, secagem, escoamento, sazonalidade' },
      { tipo: 'Cooperativa', investigar: 'Demandas coletivas e gargalos de estrutura' },
      { tipo: 'Agroindústria', investigar: 'Beneficiamento, logística de insumos e produtos' },
    ],
    roteiro: [
      'Quais culturas você trabalha e em que meses?',
      'Onde falta espaço ou estrutura hoje?',
      'Como é a armazenagem na safra e na entressafra?',
      'Que serviço ajudaria o produtor daqui?',
      'Há interesse em soluções compartilhadas/parcerias?',
    ],
  },
  turistico: {
    perguntasMestre: [
      'Que atrativos realmente atraem visitantes?',
      'Qual o fluxo turístico — e qual a fonte desse número?',
      'Que experiência falta ser oferecida?',
      'Como isso se conecta (ou não) aos outros pilares?',
      'Vale como projeto próprio, separado do investimento principal?',
    ],
    tiposPlayers: [
      { tipo: 'Operador de turismo', investigar: 'Roteiros, volume e perfil de visitantes' },
      { tipo: 'Gestor cultural / público', investigar: 'Patrimônio, eventos e dados de fluxo' },
      { tipo: 'Comércio ligado a turismo', investigar: 'Sazonalidade e demanda de visitantes' },
    ],
    roteiro: [
      'Quais atrativos mais recebem visitantes?',
      'Quantos visitantes vêm, e como você sabe disso?',
      'Que experiência falta na cidade?',
      'Que épocas concentram o movimento?',
      'Que ideia de conteúdo/experiência faria diferença?',
    ],
  },
  educacao: {
    perguntasMestre: [
      'Quantos estudantes há em São Borja e de onde vêm?',
      'Existe demanda não atendida por moradia estudantil?',
      'Que serviços faltam para os estudantes (alimentação, transporte, apoio)?',
      'O fluxo transfronteiriço de estudantes é relevante e mensurável?',
      'Que ativo da família serviria a esse público?',
    ],
    tiposPlayers: [
      { tipo: 'Estudante', investigar: 'Moradia, alimentação, transporte, custo de vida' },
      { tipo: 'Instituição de ensino', investigar: 'Nº de alunos, calendário, demandas não atendidas' },
      { tipo: 'Locador de kitnet / república', investigar: 'Ocupação, preços e sazonalidade da moradia' },
      { tipo: 'Comércio no entorno do campus', investigar: 'Demanda gerada pelo público estudantil' },
      { tipo: 'Estudante transfronteiriço', investigar: 'Deslocamento, moradia e serviços específicos' },
    ],
    roteiro: [
      'Você estuda/atua em qual instituição?',
      'Como resolveu moradia ao vir estudar aqui?',
      'Falta algum serviço para estudantes na cidade?',
      'Quanto se paga por moradia estudantil hoje?',
      'Há muitos estudantes que cruzam a fronteira para estudar?',
      'O que facilitaria a vida do estudante em São Borja?',
    ],
    hipotesesIniciais: [
      'Existe demanda não atendida por moradia estudantil / kitnets / repúblicas.',
      'Ativos da família têm potencial para uso estudantil (moradia, coworking, serviços).',
      'Existe demanda por serviços voltados a estudantes (alimentação, transporte, apoio).',
      'O fluxo estudantil movimenta a economia local de forma relevante e mensurável.',
      'A população estudantil transfronteiriça gera demanda específica.',
    ],
  },
};
