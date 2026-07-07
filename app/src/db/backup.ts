/**
 * Backup completo (JSON) e export CSV por entidade.
 * Import de backup substitui os dados atuais após confirmação do chamador.
 */
import { db, SCHEMA_VERSION } from './database';
import { limparTudo } from './repository';
import { agora } from '../lib/ids';
import { montarCSV } from '../lib/csv';
import type { BackupCompleto, Stakeholder, Ativo, Evidencia } from '../models/types';

export async function montarBackup(): Promise<BackupCompleto> {
  const [
    ativos, stakeholders, evidencias, hipoteses, oportunidades,
    businessCases, decisoes, tarefas, kpis, config,
  ] = await Promise.all([
    db.ativos.toArray(),
    db.stakeholders.toArray(),
    db.evidencias.toArray(),
    db.hipoteses.toArray(),
    db.oportunidades.toArray(),
    db.businessCases.toArray(),
    db.decisoes.toArray(),
    db.tarefas.toArray(),
    db.kpis.toArray(),
    db.config.toArray(),
  ]);
  return {
    app: 'masterplan-sao-borja',
    schemaVersion: SCHEMA_VERSION,
    exportadoEm: agora(),
    ativos, stakeholders, evidencias, hipoteses, oportunidades,
    businessCases, decisoes, tarefas, kpis, config,
  };
}

export function ehBackupValido(dados: unknown): dados is BackupCompleto {
  if (!dados || typeof dados !== 'object') return false;
  const o = dados as Record<string, unknown>;
  return o.app === 'masterplan-sao-borja' && Array.isArray(o.ativos) && Array.isArray(o.stakeholders);
}

/** Substitui todos os dados de domínio pelo conteúdo do backup (transacional). */
export async function restaurarBackup(backup: BackupCompleto): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.ativos, db.stakeholders, db.evidencias, db.hipoteses, db.oportunidades,
      db.businessCases, db.decisoes, db.tarefas, db.kpis, db.config,
    ],
    async () => {
      await limparTudo();
      await db.config.clear();
      await Promise.all([
        db.ativos.bulkAdd(backup.ativos ?? []),
        db.stakeholders.bulkAdd(backup.stakeholders ?? []),
        db.evidencias.bulkAdd(backup.evidencias ?? []),
        db.hipoteses.bulkAdd(backup.hipoteses ?? []),
        db.oportunidades.bulkAdd(backup.oportunidades ?? []),
        db.businessCases.bulkAdd(backup.businessCases ?? []),
        db.decisoes.bulkAdd(backup.decisoes ?? []),
        db.tarefas.bulkAdd(backup.tarefas ?? []),
        db.kpis.bulkAdd(backup.kpis ?? []),
        db.config.bulkAdd(backup.config ?? []),
      ]);
    }
  );
}

/* ── CSV por entidade (Fase 1: as 3 entidades que já recebem dados) ───── */
export function csvAtivos(ativos: Ativo[]): string {
  const cab = ['ID', 'Nome', 'Tipo', 'Endereço', 'Terreno m²', 'Construída m²', 'Pé direito m', 'Estado físico', 'Situação jurídica', 'Criado em'];
  const linhas = ativos.map((a) => [
    a.id, a.nome, a.tipo, a.endereco,
    a.metragens.terrenoM2 ?? '', a.metragens.construidaM2 ?? '', a.metragens.peDireitoM ?? '',
    a.estadoFisico, a.situacaoJuridicaResumo, a.createdAt,
  ]);
  return montarCSV(cab, linhas);
}

export function csvStakeholders(stk: Stakeholder[]): string {
  const cab = ['ID', 'Nome', 'Pilar', 'Segmento', 'Contato', 'Local', 'Dor/Oportunidade', 'Urgência', 'Disposição', 'Valor citado', 'Validação', 'Próximo passo', 'Data'];
  const linhas = stk.map((s) => [
    s.id, s.nome, s.pilar, s.segmento, s.contato, s.local, s.dorOportunidade,
    s.urgencia ?? '', s.disposicao ?? '', s.valorCitado ?? '', s.validacao, s.proximoPasso, s.data,
  ]);
  return montarCSV(cab, linhas);
}

export function csvEvidencias(ev: Evidencia[]): string {
  const cab = ['ID', 'Tipo', 'Conteúdo', 'Pilar', 'Fonte', 'Detalhe da fonte', 'Confiança', 'Data'];
  const linhas = ev.map((e) => [
    e.id, e.tipo, e.conteudo, e.pilar, e.fonte, e.fonteDetalhe ?? '', e.confianca, e.data,
  ]);
  return montarCSV(cab, linhas);
}
