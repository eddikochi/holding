/**
 * Ações de escrita (CRUD) sobre o Dexie. Preenchem timestamps e aplicam
 * regras de domínio na camada de dados (não só na UI).
 */
import { db, getMinEvidencias } from './database';
import { novoId, agora } from '../lib/ids';
import { ITENS_JURIDICOS } from '../models/types';
import type {
  Ativo,
  Stakeholder,
  Hipotese,
  Evidencia,
  AnalisePilar,
  Pilar,
  ItemChecklistJuridico,
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
    pilar,
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
    const vinculadas = await db.evidencias.where('hipoteseId').equals(h.id).count();
    if (vinculadas < min) {
      throw new RegraDominioError(
        `Esta hipótese precisa de pelo menos ${min} evidências vinculadas para ser marcada como validada (tem ${vinculadas}).`
      );
    }
  }
  h.updatedAt = agora();
  await db.hipoteses.put(h);
}

export async function apagarHipotese(id: string): Promise<void> {
  // desvincula evidências e stakeholders que apontavam para esta hipótese
  await db.transaction('rw', [db.hipoteses, db.evidencias, db.stakeholders], async () => {
    await db.hipoteses.delete(id);
    const evs = await db.evidencias.where('hipoteseId').equals(id).toArray();
    for (const e of evs) await db.evidencias.update(e.id, { hipoteseId: undefined });
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
    pilar,
    fonte: 'observacao_campo',
    data: ts,
    confianca: 'media',
  };
}

export async function salvarEvidencia(e: Evidencia): Promise<void> {
  e.updatedAt = agora();
  await db.evidencias.put(e);
}

export async function apagarEvidencia(id: string): Promise<void> {
  await db.evidencias.delete(id);
}

/** Vincula (ou desvincula) uma evidência a uma hipótese. */
export async function vincularEvidenciaAHipotese(
  evidenciaId: string,
  hipoteseId: string | undefined
): Promise<void> {
  await db.evidencias.update(evidenciaId, { hipoteseId, updatedAt: agora() });
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
