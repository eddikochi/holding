/**
 * Modelo de dados central do Masterplan São Borja.
 * Dono deste arquivo: agente `architect`. Nenhum outro agente altera.
 * Fonte: SPEC.md § "MODELO DE DADOS CENTRAL". Histórico em docs/DATA_MODEL.md.
 *
 * Regra de ouro: Hipótese ≠ Evidência ≠ Decisão. Entidades separadas,
 * vinculadas por ID, nunca mescladas.
 */

export type ID = string; // crypto.randomUUID()
export type ISODate = string; // ISO 8601

export interface BaseEntity {
  id: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type Pilar =
  | 'patrimonial'
  | 'juridico'
  | 'imobiliario'
  | 'economico'
  | 'logistico'
  | 'agroindustrial'
  | 'turistico'
  | 'educacao';

export const PILARES: { chave: Pilar; rotulo: string }[] = [
  { chave: 'patrimonial', rotulo: 'Patrimonial' },
  { chave: 'juridico', rotulo: 'Jurídico' },
  { chave: 'imobiliario', rotulo: 'Imobiliário' },
  { chave: 'economico', rotulo: 'Econômico' },
  { chave: 'logistico', rotulo: 'Logístico' },
  { chave: 'agroindustrial', rotulo: 'Agroindustrial' },
  { chave: 'turistico', rotulo: 'Turístico' },
  { chave: 'educacao', rotulo: 'Educação' },
];

/** Rastreabilidade de import — presente em entidades vindas da ferramenta de campo. */
export interface OrigemImportacao {
  ferramenta: string; // ex.: 'campo_hub_v1', 'sb_masterplan_v1'
  dataImport: ISODate;
  /** Garantia de zero perda: campos de origem sem destino no modelo novo. */
  camposNaoMapeados?: Record<string, unknown>;
}

/* ── 1. ATIVO ─────────────────────────────────────────────────────────── */
export type TipoAtivo = 'galpao' | 'terreno' | 'loja' | 'oficina' | 'outro';

export type StatusJuridico =
  | 'nao_iniciado'
  | 'em_andamento'
  | 'ok'
  | 'pendencia'
  | 'nao_se_aplica';

export type ItemJuridicoChave =
  | 'matricula'
  | 'inventario'
  | 'sucessao'
  | 'zoneamento'
  | 'licenciamento'
  | 'ambiental'
  | 'tributacao'
  | 'contratos'
  | 'holding_spe';

export const ITENS_JURIDICOS: { chave: ItemJuridicoChave; rotulo: string }[] = [
  { chave: 'matricula', rotulo: 'Matrícula' },
  { chave: 'inventario', rotulo: 'Inventário' },
  { chave: 'sucessao', rotulo: 'Sucessão' },
  { chave: 'zoneamento', rotulo: 'Zoneamento' },
  { chave: 'licenciamento', rotulo: 'Licenciamento' },
  { chave: 'ambiental', rotulo: 'Ambiental' },
  { chave: 'tributacao', rotulo: 'Tributação' },
  { chave: 'contratos', rotulo: 'Contratos' },
  { chave: 'holding_spe', rotulo: 'Holding / SPE' },
];

export interface ItemChecklistJuridico {
  chave: ItemJuridicoChave;
  status: StatusJuridico;
  observacao: string;
  responsavel: string;
  prazo?: ISODate;
}

export interface FotoRef {
  id: ID;
  nome: string;
  dataUrl?: string; // base64 (fase futura)
  referencia?: string; // caminho/descrição externa
}

/** Cenários de uso de um ativo (módulo 03 Imobiliário). Cada um com prós/contras. */
export interface CenariosUso {
  alugar: { pros: string; contras: string };
  retrofit: { pros: string; contras: string };
  desenvolvimento: { pros: string; contras: string };
  venda: { pros: string; contras: string };
}

/**
 * Status de visita de campo.
 * Ativo aceita 'parcial' (subdividido com só parte das unidades visitadas);
 * Unidade só é 'a_visitar' ou 'visitado' (não há meio-termo numa loja só).
 */
export type StatusVisitaAtivo = 'a_visitar' | 'visitado' | 'parcial';
export type StatusVisitaUnidade = 'a_visitar' | 'visitado';

/** Situação de ocupação de um imóvel ou unidade. */
export type OcupacaoImovel = 'locado' | 'vago' | 'uso_proprio' | 'cedido' | 'irregular';

/** Tipo de relação física entre duas unidades do mesmo ativo. */
export type TipoRelacaoUnidade = 'agua' | 'energia' | 'acesso' | 'outro';

/**
 * Relação física entre unidades de um ativo subdividido.
 * Ex.: { tipo: 'energia', alvoUnidadeId: <U3>, descricao: 'U2 recebe energia da U3' }.
 * `alvoUnidadeId` é opcional — a relação pode ser genérica ("água unificada do prédio").
 */
export interface RelacaoUnidade {
  tipo: TipoRelacaoUnidade;
  alvoUnidadeId?: ID; // outra unidade envolvida (id de Unidade dentro do mesmo Ativo)
  descricao: string;
}

/**
 * Identificação registral de um imóvel (Ativo, ou Unidade com matrícula própria).
 * Todos os campos opcionais — nem todo imóvel tem tudo levantado.
 */
export interface RegistroImovel {
  matricula?: string; // número da matrícula no Registro de Imóveis
  cartorio?: string; // cartório / RI onde está registrada
  inscricaoImobiliaria?: string; // inscrição imobiliária municipal (IPTU)
}

/** Titular de um Ativo e sua participação. `percentual` em % (0–100), opcional. */
export interface ProprietarioAtivo {
  nome: string;
  percentual?: number;
}

/**
 * Unidade locável dentro de um Ativo subdividido (ex.: 1 das 3 lojas de um prédio).
 * Vive embutida em `Ativo.unidades` (Opção A — sem store separada).
 * Todo campo específico de negócio é opcional, exceto identidade e status de visita.
 */
export interface Unidade {
  id: ID;
  nome: string;
  locatario?: string;
  contato?: string;
  /** Situação de ocupação da unidade. Opcional. */
  ocupacao?: OcupacaoImovel;
  /** Valor do aluguel (R$). Opcional — vazio quando não informado, nunca 0. */
  valorAluguel?: number;
  estadoFisico?: string;
  statusVisita: StatusVisitaUnidade;
  metragens?: {
    construidaM2?: number;
    peDireitoM?: number;
  };
  situacaoJuridicaResumo?: string;
  /** Identificação registral própria da unidade (loja pode ter matrícula separada). */
  registro?: RegistroImovel;
  /** Potencial por pilar da unidade (2º nível). Independe do potencial do prédio. */
  potencialPorPilar?: Partial<Record<Pilar, string>>;
  relacoes?: RelacaoUnidade[];
  origem?: OrigemImportacao;
}

export interface Ativo extends BaseEntity {
  nome: string;
  tipo: TipoAtivo;
  endereco: string;
  lat?: number;
  lng?: number;
  metragens: {
    terrenoM2?: number;
    construidaM2?: number;
    peDireitoM?: number;
  };
  estadoFisico: string;
  /** Situação de ocupação do imóvel. Opcional. */
  ocupacao?: OcupacaoImovel;
  /** Valor do aluguel (R$). Opcional — vazio quando não informado, nunca 0. */
  valorAluguel?: number;
  fotos: FotoRef[];
  potencialPorPilar: Partial<Record<Pilar, string>>;
  situacaoJuridicaResumo: string;
  /** Identificação registral do imóvel (matrícula, cartório, inscrição). Opcional. */
  registro?: RegistroImovel;
  /** Titularidade e participação de cada proprietário. Opcional. */
  proprietarios?: ProprietarioAtivo[];
  checklistJuridico: ItemChecklistJuridico[]; // sempre os 9 itens
  cenariosUso?: CenariosUso; // módulo 03 (opcional, preenchido sob demanda)
  /** Status de visita do prédio (novo, opcional — ativos antigos ficam undefined). */
  statusVisita?: StatusVisitaAtivo;
  /** true = prédio subdividido em unidades locáveis. Ausente/false = bloco único. */
  ehSubdividido?: boolean;
  /** Unidades filhas (embutidas). Ausente/[] = ativo de bloco único (retrocompatível). */
  unidades?: Unidade[];
  origem?: OrigemImportacao;
}

/* ── 2. STAKEHOLDER ───────────────────────────────────────────────────── */
export type Urgencia = 'alta' | 'media' | 'baixa';
export type Disposicao = 'sim' | 'talvez' | 'nao' | 'nao_perguntado';
export type ValidacaoRegistro = 'nao_validado' | 'parcial' | 'validado';

export interface Stakeholder extends BaseEntity {
  nome: string;
  pilar: Pilar;
  segmento: string;
  contato: string;
  local: string;
  ativoId?: ID;
  /** Vínculo a uma unidade específica de um ativo subdividido (opcional). */
  unidadeId?: ID;
  dorOportunidade: string;
  urgencia?: Urgencia;
  disposicao?: Disposicao;
  /** Valor citado pelo entrevistado (texto livre). Adicionado v1 — ver DATA_MODEL.md. */
  valorCitado?: string;
  hipoteseId?: ID;
  validacao: ValidacaoRegistro;
  proximoPasso: string;
  data: ISODate;
  origem?: OrigemImportacao;
}

/* ── 3. EVIDÊNCIA ─────────────────────────────────────────────────────── */
export type TipoEvidencia = 'texto' | 'observacao' | 'foto' | 'documento';
export type FonteEvidencia =
  | 'entrevista'
  | 'observacao_campo'
  | 'pesquisa_desk'
  | 'dado_oficial';
export type Confianca = 'alta' | 'media' | 'baixa';

export interface Evidencia extends BaseEntity {
  tipo: TipoEvidencia;
  conteudo: string;
  foto?: FotoRef;
  pilar: Pilar;
  fonte: FonteEvidencia;
  /** Rótulo livre da origem específica, ex.: "Registro de campo — Rota Comercial". */
  fonteDetalhe?: string;
  data: ISODate;
  ativoId?: ID;
  /** Vínculo a uma unidade específica de um ativo subdividido (opcional). */
  unidadeId?: ID;
  stakeholderId?: ID;
  hipoteseId?: ID;
  confianca: Confianca;
  origem?: OrigemImportacao;
}

/* ── 4. HIPÓTESE ──────────────────────────────────────────────────────── */
export type StatusHipotese =
  | 'nao_validada'
  | 'parcial'
  | 'validada'
  | 'refutada';

export interface Hipotese extends BaseEntity {
  enunciado: string;
  pilar: Pilar;
  criteriosValidacao: string;
  /** 'validada' exige ≥ N evidências vinculadas (config minEvidenciasParaValidar). */
  status: StatusHipotese;
  decisaoId?: ID;
  // evidências vinculadas = consulta por Evidencia.hipoteseId (normalizado)
}

/* ── 5. OPORTUNIDADE ──────────────────────────────────────────────────── */
export type Nota1a5 = 1 | 2 | 3 | 4 | 5;
export type StatusOportunidade =
  | 'ideia'
  | 'em_avaliacao'
  | 'promovida'
  | 'descartada';

export interface Oportunidade extends BaseEntity {
  nome: string;
  pilares: Pilar[];
  descricao: string;
  hipoteseIds: ID[];
  impacto?: Nota1a5;
  investimento?: Nota1a5;
  risco?: Nota1a5;
  esforco?: Nota1a5;
  status: StatusOportunidade;
  posicaoMatriz?: { x: number; y: number }; // matriz drag-and-drop (Fase 4)
}

/* ── 6. BUSINESS CASE ─────────────────────────────────────────────────── */
export interface LinhaFinanceira {
  id: ID;
  descricao: string;
  valor: number | null;
  fontePremissa: string;
}

export interface Cenario {
  receitaAnual: number | null;
  premissas: string;
}

export type DecisaoBC = 'go' | 'no_go' | 'aguardar';

export interface BusinessCase extends BaseEntity {
  oportunidadeId?: ID; // opcional: BC pode nascer da promoção de uma oportunidade ou avulso
  nome: string;
  resumoExecutivo: string;
  modeloNegocio: string;
  premissas: string;
  capex: LinhaFinanceira[];
  opex: LinhaFinanceira[]; // mensal
  receitas: LinhaFinanceira[]; // mensal
  cenarios: {
    pessimista: Cenario;
    realista: Cenario;
    otimista: Cenario;
  };
  riscos: string;
  decisao?: DecisaoBC;
  // payback é calculado (função pura), nunca armazenado
}

/* ── 7. DECISÃO (Decision Log) ────────────────────────────────────────── */
export interface Decisao extends BaseEntity {
  data: ISODate;
  contexto: string;
  decisao: string;
  motivo: string;
  quemDecidiu: string;
  reversivel: boolean;
  hipoteseIds: ID[];
  evidenciaIds: ID[];
}

/* ── 8. TAREFA / MARCO ────────────────────────────────────────────────── */
export type Horizonte = 'h0_12m' | 'h1_3a' | 'h3_5a' | 'h5_10a';
export type StatusTarefa =
  | 'a_fazer'
  | 'em_andamento'
  | 'concluida'
  | 'bloqueada';

export interface Tarefa extends BaseEntity {
  titulo: string;
  pilar?: Pilar;
  horizonte: Horizonte;
  status: StatusTarefa;
  dependenciasIds: ID[]; // "bloqueado por"
  responsavel: string;
  businessCaseId?: ID;
}

/* ── 9. KPI ───────────────────────────────────────────────────────────── */
export interface Medicao {
  data: ISODate;
  valor: number;
}

export interface KPI extends BaseEntity {
  nome: string;
  pilar?: Pilar;
  unidade: string;
  valorAlvo: number | null;
  historico: Medicao[]; // valor atual = última medição (derivado)
}

/* ── Análise por pilar (SWOT + leitura executiva) ─────────────────────── */
export interface SwotItem {
  id: ID;
  texto: string;
}

export interface Swot {
  forcas: SwotItem[];
  fraquezas: SwotItem[];
  oportunidades: SwotItem[];
  ameacas: SwotItem[];
}

export type QuadranteSwot = keyof Swot;

/** Uma análise por pilar (unicidade lógica por `pilar`). */
export interface AnalisePilar extends BaseEntity {
  pilar: Pilar;
  swot: Swot;
  leituraExecutiva: string;
  recomendacoes: string;
}

/* ── Comparável imobiliário (módulo 03) ───────────────────────────────── */
/** Imóvel pesquisado no mercado, para calcular R$/m² médio por tipo. */
export interface ComparavelImobiliario extends BaseEntity {
  descricao: string;
  tipo: TipoAtivo;
  m2?: number;
  precoPedido?: number; // venda, R$
  aluguelMensal?: number; // R$/mês
  fonte: string; // de onde veio o dado (anúncio, corretor…) — nunca vazio na prática
  data: ISODate;
  observacao?: string;
}

/* ── Sazonalidade agro (módulo 06) — guardada em Config ───────────────── */
export type IntensidadeSazonal = 'baixa' | 'media' | 'alta' | 'nenhuma';
export interface SazonalidadeMes {
  mes: number; // 0 = janeiro … 11 = dezembro
  intensidade: IntensidadeSazonal;
  nota: string;
}

/* ── Governança familiar (módulo 12) — guardada em Config ─────────────── */
export interface PapelFamiliar {
  id: ID;
  nome: string;
  papel: string;
  responsabilidades: string;
}
export interface Rito {
  id: ID;
  nome: string;
  frequencia: string;
  pauta: string;
}

/* ── Checklist de discovery por pilar (guardado em Config) ────────────── */
export type CategoriaDiscovery = 'campo' | 'desk';
export interface ItemChecklistDiscovery {
  id: string;
  texto: string;
  categoria: CategoriaDiscovery;
  feito: boolean;
  custom: boolean; // true = adicionado pelo usuário; false = item padrão do onboarding
}

/* ── Config (store auxiliar, não é entidade de domínio) ───────────────── */
export interface Config {
  chave: string;
  valor: unknown;
}

/** Formato do backup JSON completo do app. */
export interface BackupCompleto {
  app: 'masterplan-sao-borja';
  schemaVersion: number;
  exportadoEm: ISODate;
  ativos: Ativo[];
  stakeholders: Stakeholder[];
  evidencias: Evidencia[];
  hipoteses: Hipotese[];
  oportunidades: Oportunidade[];
  businessCases: BusinessCase[];
  decisoes: Decisao[];
  tarefas: Tarefa[];
  kpis: KPI[];
  analises: AnalisePilar[];
  comparaveis: ComparavelImobiliario[];
  config: Config[];
}
