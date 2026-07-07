/**
 * Dexie sobre IndexedDB. Stores e versões de schema.
 * Dono do schema: agente `architect`. Mudanças de store passam por ele.
 */
import Dexie, { type Table } from 'dexie';
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
  Config,
} from '../models/types';

export const SCHEMA_VERSION = 1;

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
  }
}

export const db = new MasterplanDB();

/** Config: mínimo de evidências para validar uma hipótese (regra de ouro). */
export const CONFIG_MIN_EVIDENCIAS = 'minEvidenciasParaValidar';
export const DEFAULT_MIN_EVIDENCIAS = 3;

export async function getMinEvidencias(): Promise<number> {
  const c = await db.config.get(CONFIG_MIN_EVIDENCIAS);
  return typeof c?.valor === 'number' ? (c.valor as number) : DEFAULT_MIN_EVIDENCIAS;
}
