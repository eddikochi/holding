/**
 * Ações de escrita (CRUD) sobre o Dexie. Preenchem timestamps e aplicam
 * regras de domínio na camada de dados (não só na UI).
 */
import { db, getMinEvidencias, CONFIG_PROX_EV, CONFIG_PROX_HIP } from './database';
import { novoId, agora } from '../lib/ids';
import { ITENS_JURIDICOS, vinculosDe, pilaresDe } from '../models/types';
import type {
  Ativo,
  Stakeholder,
  Hipotese,
  Evidencia,
  AnalisePilar,
  ComparavelImobiliario,
  SazonalidadeMes,
  Oportunidade,
  BusinessCase,
  Tarefa,
  Decisao,
  KPI,
  Medicao,
  PapelFamiliar,
  Rito,
  Pilar,
  TipoAtivo,
  Horizonte,
  ItemChecklistJuridico,
  ItemChecklistDiscovery,
  CategoriaDiscovery,
  EfeitoVinculo,
} from '../models/types';

/** Erro de violação de regra de domínio (a UI mostra a mensagem). */
export class RegraDominioError extends Error {}

function checklistVazio(): ItemChecklistJuridico[] {
  return ITENS_JURIDICOS.map((i) => ({
    chave: i.chave,
    status: 'nao_iniciado' as const,
    observacao: '',
    responsavel: '',
  }));
}

/* ── ATIVO ────────────────────────────────────────────────────────────── */
export function ativoEmBranco(): Ativo {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    nome: '',
    tipo: 'galpao',
    endereco: '',
    metragens: {},
    estadoFisico: '',
    fotos: [],
    potencialPorPilar: {},
    situacaoJuridicaResumo: '',
    checklistJuridico: checklistVazio(),
  };
}

export async function salvarAtivo(a: Ativo): Promise<void> {
  // garante os 9 itens do checklist mesmo em ativos importados antigos
  if (!a.checklistJuridico || a.checklistJuridico.length === 0) {
    a.checklistJuridico = checklistVazio();
  }
  a.updatedAt = agora();
  await db.ativos.put(a);
}

export async function apagarAtivo(id: string): Promise<void> {
  await db.ativos.delete(id);
}

/* ── STAKEHOLDER ──────────────────────────────────────────────────────── */
export function stakeholderEmBranco(pilar: Pilar): Stakeholder {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    nome: '',
    pilar,
    segmento: '',
    contato: '',
    local: '',
    dorOportunidade: '',
    validacao: 'nao_validado',
    proximoPasso: '',
    data: ts,
  };
}

export async function salvarStakeholder(s: Stakeholder): Promise<void> {
  s.updatedAt = agora();
  await db.stakeholders.put(s);
}

export async function apagarStakeholder(id: string): Promise<void> {
  await db.stakeholders.delete(id);
}

/* ── HIPÓTESE (com regra de validação) ────────────────────────────────── */
export function hipoteseEmBranco(pilar: Pilar): Hipotese {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    enunciado: '',
    pilares: [pilar],
    criteriosValidacao: '',
    status: 'nao_validada',
  };
}

/**
 * Salva a hipótese. Regra de ouro: só pode ir a 'validada' com >= N evidências
 * vinculadas. A checagem é feita aqui (camada de dados), não só na UI.
 */
export async function salvarHipotese(h: Hipotese): Promise<void> {
  if (h.status === 'validada') {
    const min = await getMinEvidencias();
    // Regra de ouro: conta só evidências que SUSTENTAM (efeito 'sustenta').
    // `vinculos` não é indexado (é array de objeto) — filtra em memória.
    const todas = await db.evidencias.toArray();
    const vinculadas = todas.filter((e) =>
      vinculosDe(e).some((v) => v.hipoteseId === h.id && v.efeito === 'sustenta')
    ).length;
    if (vinculadas < min) {
      throw new RegraDominioError(
        `Esta hipótese precisa de pelo menos ${min} evidências que a sustentam para ser marcada como validada (tem ${vinculadas}).`
      );
    }
  }
  if (!h.codigo) h.codigo = await proximoCodigo('HIP', CONFIG_PROX_HIP);
  h.updatedAt = agora();
  await db.hipoteses.put(h);
}

export async function apagarHipotese(id: string): Promise<void> {
  // desvincula evidências e stakeholders que apontavam para esta hipótese
  await db.transaction('rw', [db.hipoteses, db.evidencias, db.stakeholders], async () => {
    await db.hipoteses.delete(id);
    // vinculos não é indexado: varre todas e remove o vínculo desta hipótese.
    const evs = await db.evidencias.toArray();
    for (const e of evs) {
      const vs = vinculosDe(e);
      if (vs.some((v) => v.hipoteseId === id)) {
        await db.evidencias.update(e.id, { vinculos: vs.filter((v) => v.hipoteseId !== id) });
      }
    }
    // Stakeholder está fora de escopo desta fase: mantém `hipoteseId` único (indexado).
    const sts = await db.stakeholders.where('hipoteseId').equals(id).toArray();
    for (const s of sts) await db.stakeholders.update(s.id, { hipoteseId: undefined });
  });
}

/* ── EVIDÊNCIA ────────────────────────────────────────────────────────── */
export function evidenciaEmBranco(pilar: Pilar): Evidencia {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    tipo: 'observacao',
    conteudo: '',
    pilares: [pilar],
    fonte: 'observacao_campo',
    data: ts,
    confianca: 'media',
    vinculos: [],
  };
}

/**
 * Próximo código estruturado da sequência ('EV-{n}'/'HIP-{n}'), incrementando o
 * contador persistente do Config de forma atômica (transação rw). Imutável depois.
 */
async function proximoCodigo(prefixo: 'EV' | 'HIP', chave: string): Promise<string> {
  let n = 1;
  await db.transaction('rw', db.config, async () => {
    const c = await db.config.get(chave);
    n = typeof c?.valor === 'number' ? (c.valor as number) : 1;
    await db.config.put({ chave, valor: n + 1 });
  });
  return `${prefixo}-${n}`;
}

export async function salvarEvidencia(e: Evidencia): Promise<void> {
  if (!e.codigo) e.codigo = await proximoCodigo('EV', CONFIG_PROX_EV);
  e.updatedAt = agora();
  await db.evidencias.put(e);
}

export async function apagarEvidencia(id: string): Promise<void> {
  await db.evidencias.delete(id);
}

/**
 * Vincula (ou desvincula) uma evidência a UMA hipótese com um efeito.
 * Comportamento de vínculo único (a UI multi-vínculo com efeito é da Fase 3):
 * grava `vinculos` com um item, ou vazio ao desvincular.
 */
export async function vincularEvidenciaAHipotese(
  evidenciaId: string,
  hipoteseId: string | undefined,
  efeito: EfeitoVinculo = 'sustenta'
): Promise<void> {
  const vinculos = hipoteseId ? [{ hipoteseId, efeito }] : [];
  await db.evidencias.update(evidenciaId, { vinculos, updatedAt: agora() });
}

/* ── ANÁLISE POR PILAR ────────────────────────────────────────────────── */
/** Busca a análise do pilar; cria uma vazia (não persistida) se não existir. */
export async function obterOuCriarAnalise(pilar: Pilar): Promise<AnalisePilar> {
  const existente = await db.analises.where('pilar').equals(pilar).first();
  if (existente) return existente;
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    pilar,
    swot: { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] },
    leituraExecutiva: '',
    recomendacoes: '',
  };
}

export async function salvarAnalise(a: AnalisePilar): Promise<void> {
  a.updatedAt = agora();
  await db.analises.put(a);
}

/* ── COMPARÁVEL IMOBILIÁRIO (módulo 03) ───────────────────────────────── */
export function comparavelEmBranco(tipo: TipoAtivo = 'galpao'): ComparavelImobiliario {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    descricao: '',
    tipo,
    fonte: '',
    data: ts,
  };
}

export async function salvarComparavel(c: ComparavelImobiliario): Promise<void> {
  c.updatedAt = agora();
  await db.comparaveis.put(c);
}

export async function apagarComparavel(id: string): Promise<void> {
  await db.comparaveis.delete(id);
}

/* ── SAZONALIDADE AGRO (módulo 06) — guardada em Config ───────────────── */
const SAZONALIDADE_CHAVE = 'sazonalidade_agro';

export function sazonalidadeVazia(): SazonalidadeMes[] {
  return Array.from({ length: 12 }, (_, mes) => ({ mes, intensidade: 'nenhuma' as const, nota: '' }));
}

export async function obterSazonalidade(): Promise<SazonalidadeMes[]> {
  const c = await db.config.get(SAZONALIDADE_CHAVE);
  const v = c?.valor as SazonalidadeMes[] | undefined;
  if (Array.isArray(v) && v.length === 12) return v;
  return sazonalidadeVazia();
}

export async function salvarSazonalidade(meses: SazonalidadeMes[]): Promise<void> {
  await db.config.put({ chave: SAZONALIDADE_CHAVE, valor: meses });
}

/* ── OPORTUNIDADE (módulo 08) ─────────────────────────────────────────── */
export function oportunidadeEmBranco(): Oportunidade {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    nome: '',
    pilares: [],
    descricao: '',
    hipoteseIds: [],
    status: 'ideia',
  };
}

export async function salvarOportunidade(o: Oportunidade): Promise<void> {
  o.updatedAt = agora();
  await db.oportunidades.put(o);
}

export async function apagarOportunidade(id: string): Promise<void> {
  await db.oportunidades.delete(id);
}

/** Promove uma hipótese (idealmente validada) a oportunidade. */
export async function promoverHipoteseParaOportunidade(hipoteseId: string): Promise<Oportunidade> {
  const h = await db.hipoteses.get(hipoteseId);
  const o = oportunidadeEmBranco();
  if (h) {
    o.nome = h.enunciado.slice(0, 80);
    o.pilares = pilaresDe(h);
    o.hipoteseIds = [h.id];
    o.descricao = `Promovida da hipótese: ${h.enunciado}`;
    o.status = 'em_avaliacao';
  }
  await salvarOportunidade(o);
  return o;
}

/* ── BUSINESS CASE (módulo 10) ────────────────────────────────────────── */
export function businessCaseEmBranco(nome = ''): BusinessCase {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    nome,
    resumoExecutivo: '',
    modeloNegocio: '',
    premissas: '',
    capex: [],
    opex: [],
    receitas: [],
    cenarios: {
      pessimista: { receitaAnual: null, premissas: '' },
      realista: { receitaAnual: null, premissas: '' },
      otimista: { receitaAnual: null, premissas: '' },
    },
    riscos: '',
  };
}

export async function salvarBusinessCase(bc: BusinessCase): Promise<void> {
  bc.updatedAt = agora();
  await db.businessCases.put(bc);
}

export async function apagarBusinessCase(id: string): Promise<void> {
  await db.businessCases.delete(id);
}

/** Promove uma oportunidade priorizada a business case e marca a oportunidade. */
export async function promoverOportunidadeParaBC(oportunidadeId: string): Promise<BusinessCase> {
  const o = await db.oportunidades.get(oportunidadeId);
  const bc = businessCaseEmBranco(o?.nome ?? 'Novo business case');
  bc.oportunidadeId = oportunidadeId;
  if (o) {
    bc.resumoExecutivo = o.descricao;
    await salvarOportunidade({ ...o, status: 'promovida' });
  }
  await salvarBusinessCase(bc);
  return bc;
}

/* ── PESOS DE PRIORIZAÇÃO (módulo 09) — em Config ─────────────────────── */
const PESOS_CHAVE = 'pesos_priorizacao';
export interface PesosPriorizacao {
  impacto: number;
  investimento: number;
  risco: number;
}
export const PESOS_PADRAO: PesosPriorizacao = { impacto: 1, investimento: 0.5, risco: 0.5 };

export async function obterPesos(): Promise<PesosPriorizacao> {
  const c = await db.config.get(PESOS_CHAVE);
  const v = c?.valor as PesosPriorizacao | undefined;
  return v && typeof v.impacto === 'number' ? v : { ...PESOS_PADRAO };
}

export async function salvarPesos(p: PesosPriorizacao): Promise<void> {
  await db.config.put({ chave: PESOS_CHAVE, valor: p });
}

/* ── TAREFA / MARCO (módulo 11) ───────────────────────────────────────── */
export function tarefaEmBranco(horizonte: Horizonte = 'h0_12m'): Tarefa {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    titulo: '',
    horizonte,
    status: 'a_fazer',
    dependenciasIds: [],
    responsavel: '',
  };
}

export async function salvarTarefa(t: Tarefa): Promise<void> {
  t.updatedAt = agora();
  await db.tarefas.put(t);
}

export async function apagarTarefa(id: string): Promise<void> {
  // remove esta tarefa das dependências de outras
  await db.transaction('rw', db.tarefas, async () => {
    await db.tarefas.delete(id);
    const comDep = await db.tarefas.filter((t) => t.dependenciasIds.includes(id)).toArray();
    for (const t of comDep) {
      await db.tarefas.update(t.id, { dependenciasIds: t.dependenciasIds.filter((d) => d !== id) });
    }
  });
}

/* ── DECISÃO (Decision Log, módulo 12) ────────────────────────────────── */
export function decisaoEmBranco(): Decisao {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    data: ts,
    contexto: '',
    decisao: '',
    motivo: '',
    quemDecidiu: '',
    reversivel: true,
    hipoteseIds: [],
    evidenciaIds: [],
  };
}

export async function salvarDecisao(d: Decisao): Promise<void> {
  d.updatedAt = agora();
  await db.decisoes.put(d);
}

export async function apagarDecisao(id: string): Promise<void> {
  await db.decisoes.delete(id);
}

/* ── KPI (módulo 12) ──────────────────────────────────────────────────── */
export function kpiEmBranco(): KPI {
  const ts = agora();
  return {
    id: novoId(),
    createdAt: ts,
    updatedAt: ts,
    nome: '',
    unidade: '',
    valorAlvo: null,
    historico: [],
  };
}

export async function salvarKPI(k: KPI): Promise<void> {
  k.updatedAt = agora();
  await db.kpis.put(k);
}

export async function apagarKPI(id: string): Promise<void> {
  await db.kpis.delete(id);
}

/** Adiciona uma medição ao histórico do KPI (mantém ordenado por data). */
export async function registrarMedicao(kpiId: string, medicao: Medicao): Promise<void> {
  const k = await db.kpis.get(kpiId);
  if (!k) return;
  const historico = [...k.historico, medicao].sort((a, b) => (a.data < b.data ? -1 : 1));
  await db.kpis.update(kpiId, { historico, updatedAt: agora() });
}

/* ── GOVERNANÇA (módulo 12) — em Config ───────────────────────────────── */
const GOV_PAPEIS = 'governanca_papeis';
const GOV_RITOS = 'governanca_ritos';
const GOV_MODELO = 'governanca_modelo';

export async function obterPapeis(): Promise<PapelFamiliar[]> {
  const c = await db.config.get(GOV_PAPEIS);
  return Array.isArray(c?.valor) ? (c!.valor as PapelFamiliar[]) : [];
}
export async function salvarPapeis(papeis: PapelFamiliar[]): Promise<void> {
  await db.config.put({ chave: GOV_PAPEIS, valor: papeis });
}
export async function obterRitos(): Promise<Rito[]> {
  const c = await db.config.get(GOV_RITOS);
  return Array.isArray(c?.valor) ? (c!.valor as Rito[]) : [];
}
export async function salvarRitos(ritos: Rito[]): Promise<void> {
  await db.config.put({ chave: GOV_RITOS, valor: ritos });
}
export async function obterModeloDecisorio(): Promise<string> {
  const c = await db.config.get(GOV_MODELO);
  return typeof c?.valor === 'string' ? c.valor : '';
}
export async function salvarModeloDecisorio(texto: string): Promise<void> {
  await db.config.put({ chave: GOV_MODELO, valor: texto });
}

/* ── ONBOARDING dos diagnósticos (Config): 1ª visita + checklist ──────── */
export async function onboardingVisto(slug: string): Promise<boolean> {
  const c = await db.config.get('onboarding_visto_' + slug);
  return c?.valor === true;
}
export async function marcarOnboardingVisto(slug: string): Promise<void> {
  await db.config.put({ chave: 'onboarding_visto_' + slug, valor: true });
}
/**
 * Checklist de discovery por pilar (Config, chave v2). Itens são marcáveis,
 * editáveis, removíveis e extensíveis. Na 1ª vez, inicializa a partir dos
 * itens padrão do onboarding (campo/desk); depois a lista persistida é a fonte.
 */
const CHK_DISCOVERY = (slug: string) => 'discovery_checklist_v2_' + slug;

export async function obterChecklistDiscovery(
  slug: string,
  padrao: { texto: string; categoria: CategoriaDiscovery }[]
): Promise<ItemChecklistDiscovery[]> {
  const c = await db.config.get(CHK_DISCOVERY(slug));
  if (Array.isArray(c?.valor)) return c!.valor as ItemChecklistDiscovery[];
  const inicial: ItemChecklistDiscovery[] = padrao.map((d, i) => ({
    id: 'def_' + i,
    texto: d.texto,
    categoria: d.categoria,
    feito: false,
    custom: false,
  }));
  await db.config.put({ chave: CHK_DISCOVERY(slug), valor: inicial });
  return inicial;
}

export async function salvarChecklistDiscovery(slug: string, itens: ItemChecklistDiscovery[]): Promise<void> {
  await db.config.put({ chave: CHK_DISCOVERY(slug), valor: itens });
}

/** Progresso do discovery = % de itens marcados. Função pura. */
export function progressoChecklist(itens: ItemChecklistDiscovery[]): number {
  if (!itens.length) return 0;
  return Math.round((itens.filter((i) => i.feito).length / itens.length) * 100);
}
