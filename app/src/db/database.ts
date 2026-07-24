/**
 * Dexie sobre IndexedDB. Stores e versões de schema.
 * Dono do schema: agente `architect`. Mudanças de store passam por ele.
 */
import Dexie, { type Table } from 'dexie';
import { planejarCodigos } from './migracaoCodigos';
import type {
  Ativo,
  Stakeholder,
  Evidencia,
  Hipotese,
  Oportunidade,
  BusinessCase,
  Decisao,
  Tarefa,
  KPI,
  AnalisePilar,
  ComparavelImobiliario,
  Config,
} from '../models/types';

export const SCHEMA_VERSION = 5;

export class MasterplanDB extends Dexie {
  ativos!: Table<Ativo, string>;
  stakeholders!: Table<Stakeholder, string>;
  evidencias!: Table<Evidencia, string>;
  hipoteses!: Table<Hipotese, string>;
  oportunidades!: Table<Oportunidade, string>;
  businessCases!: Table<BusinessCase, string>;
  decisoes!: Table<Decisao, string>;
  tarefas!: Table<Tarefa, string>;
  kpis!: Table<KPI, string>;
  analises!: Table<AnalisePilar, string>;
  comparaveis!: Table<ComparavelImobiliario, string>;
  config!: Table<Config, string>;

  constructor() {
    super('masterplan_sao_borja');
    // v1: índices apenas nos campos usados para consulta/filtro.
    this.version(1).stores({
      ativos: 'id, tipo, nome',
      stakeholders: 'id, pilar, ativoId, hipoteseId, validacao',
      evidencias: 'id, pilar, fonte, ativoId, stakeholderId, hipoteseId, confianca',
      hipoteses: 'id, pilar, status',
      oportunidades: 'id, status',
      businessCases: 'id, oportunidadeId',
      decisoes: 'id, data',
      tarefas: 'id, horizonte, status, businessCaseId',
      kpis: 'id, pilar',
      config: 'chave',
    });
    // v2: nova store `analises` (SWOT + leitura executiva por pilar). Migração aditiva.
    this.version(2).stores({
      analises: 'id, pilar',
    });
    // v3: nova store `comparaveis` (imóveis pesquisados, módulo 03). Migração aditiva.
    this.version(3).stores({
      comparaveis: 'id, tipo',
    });
    // v4: Evidencia/Hipotese passam a pilar-múltiplo (índice multiEntry *pilares) e
    //     Evidencia troca `hipoteseId` único por `vinculos[]` (filtro em memória — índice
    //     hipoteseId removido). O upgrade popula os campos novos a partir dos legados e
    //     remove os legados do storage (fonte única). Mecânico e retrocompatível.
    this.version(4).stores({
      evidencias: 'id, *pilares, fonte, ativoId, stakeholderId, confianca',
      hipoteses: 'id, *pilares, status',
    }).upgrade(async (tx) => {
      await tx.table('evidencias').toCollection().modify((e: Record<string, unknown>) => {
        if (!Array.isArray(e.pilares)) e.pilares = e.pilar ? [e.pilar] : [];
        if (!Array.isArray(e.vinculos)) {
          e.vinculos = e.hipoteseId ? [{ hipoteseId: e.hipoteseId, efeito: 'sustenta' }] : [];
        }
        delete e.pilar;
        delete e.hipoteseId;
      });
      await tx.table('hipoteses').toCollection().modify((h: Record<string, unknown>) => {
        if (!Array.isArray(h.pilares)) h.pilares = h.pilar ? [h.pilar] : [];
        delete h.pilar;
      });
    });
    // v5: código estruturado EV-{n}/HIP-{n} (Fase 2). Índice `codigo`; o upgrade atribui
    //     codigo/codigoLegado aos existentes (opção a), limpa o prefixo do texto e semeia
    //     os contadores. Lógica pura em migracaoCodigos.ts (mesma do dry-run).
    this.version(5).stores({
      evidencias: 'id, *pilares, fonte, ativoId, stakeholderId, confianca, codigo',
      hipoteses: 'id, *pilares, status, codigo',
    }).upgrade(async (tx) => {
      const evs = await tx.table('evidencias').toArray();
      const hips = await tx.table('hipoteses').toArray();
      const planEv = planejarCodigos(evs, 'EV', (e) => e.conteudo);
      const planHip = planejarCodigos(hips, 'HIP', (h) => h.enunciado);
      for (const p of planEv.patches) {
        const patch: Record<string, unknown> = { codigo: p.codigo };
        if (p.codigoLegado !== undefined) { patch.codigoLegado = p.codigoLegado; patch.conteudo = p.textoLimpo; }
        await tx.table('evidencias').update(p.id, patch);
      }
      for (const p of planHip.patches) {
        const patch: Record<string, unknown> = { codigo: p.codigo };
        if (p.codigoLegado !== undefined) { patch.codigoLegado = p.codigoLegado; patch.enunciado = p.textoLimpo; }
        await tx.table('hipoteses').update(p.id, patch);
      }
      await tx.table('config').put({ chave: CONFIG_PROX_EV, valor: planEv.prox });
      await tx.table('config').put({ chave: CONFIG_PROX_HIP, valor: planHip.prox });
    });
  }
}

export const db = new MasterplanDB();

/** Config: contadores persistentes do código estruturado (Fase 2). Próximo n livre. */
export const CONFIG_PROX_EV = 'proxEV';
export const CONFIG_PROX_HIP = 'proxHIP';

/** Config: ids dos ativos designados como galpão operacional do pilar logístico (Fase 4.3). */
export const CONFIG_LOGISTICO_ATIVOS = 'logistico_ativosIds';

/** Config: mínimo de evidências para validar uma hipótese (regra de ouro). */
export const CONFIG_MIN_EVIDENCIAS = 'minEvidenciasParaValidar';
export const DEFAULT_MIN_EVIDENCIAS = 3;

export async function getMinEvidencias(): Promise<number> {
  const c = await db.config.get(CONFIG_MIN_EVIDENCIAS);
  return typeof c?.valor === 'number' ? (c.valor as number) : DEFAULT_MIN_EVIDENCIAS;
}
