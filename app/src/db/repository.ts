/**
 * CRUD por entidade sobre o Dexie. Preenche createdAt/updatedAt.
 * Camada de efeitos: separada das funções puras de cálculo.
 */
import { db } from './database';
import { novoId, agora } from '../lib/ids';
import type { BaseEntity } from '../models/types';

/** Contagens usadas na Home e no preview de import. */
export async function contarTudo() {
  const [
    ativos,
    stakeholders,
    evidencias,
    hipoteses,
    oportunidades,
    businessCases,
    decisoes,
    tarefas,
    kpis,
  ] = await Promise.all([
    db.ativos.count(),
    db.stakeholders.count(),
    db.evidencias.count(),
    db.hipoteses.count(),
    db.oportunidades.count(),
    db.businessCases.count(),
    db.decisoes.count(),
    db.tarefas.count(),
    db.kpis.count(),
  ]);
  return {
    ativos,
    stakeholders,
    evidencias,
    hipoteses,
    oportunidades,
    businessCases,
    decisoes,
    tarefas,
    kpis,
  };
}

/** Cria uma entidade preenchendo id e timestamps se ausentes. */
export function comMetadados<T extends BaseEntity>(parcial: Omit<T, keyof BaseEntity> & Partial<BaseEntity>): T {
  const ts = agora();
  return {
    ...(parcial as object),
    id: parcial.id ?? novoId(),
    createdAt: parcial.createdAt ?? ts,
    updatedAt: parcial.updatedAt ?? ts,
  } as T;
}

/** Apaga todos os dados de domínio (usado antes de importar backup). Preserva config. */
export async function limparTudo(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.ativos,
      db.stakeholders,
      db.evidencias,
      db.hipoteses,
      db.oportunidades,
      db.businessCases,
      db.decisoes,
      db.tarefas,
      db.kpis,
      db.analises,
      db.comparaveis,
    ],
    async () => {
      await Promise.all([
        db.ativos.clear(),
        db.stakeholders.clear(),
        db.evidencias.clear(),
        db.hipoteses.clear(),
        db.oportunidades.clear(),
        db.businessCases.clear(),
        db.decisoes.clear(),
        db.tarefas.clear(),
        db.kpis.clear(),
        db.analises.clear(),
        db.comparaveis.clear(),
      ]);
    }
  );
}
