/**
 * Backup completo (JSON) e export CSV por entidade.
 * Import de backup substitui os dados atuais após confirmação do chamador.
 */
import { db, CONFIG_PROX_EV, CONFIG_PROX_HIP } from './database';
import { limparTudo } from './repository';
import { agora } from '../lib/ids';
import { montarCSV } from '../lib/csv';
import { planejarCodigos, type PatchCodigo } from './migracaoCodigos';
import { pilaresDe, vinculosDe } from '../models/types';
import type { BackupCompleto, Stakeholder, Ativo, Evidencia, Hipotese, Config } from '../models/types';

/**
 * Versão do FORMATO do arquivo de backup (não confundir com a versão do schema
 * Dexie, que segue nas chamadas .version() de database.ts e não mudou de store).
 * v4: Ativo passou a carregar `unidades` embutidas + `statusVisita`/`ehSubdividido`;
 *     Stakeholder e Evidencia ganharam `unidadeId`.
 * v5: Ativo e Unidade ganharam `registro` (matrícula/cartório/inscrição), `ocupacao`
 *     e `valorAluguel`; Ativo ganhou `proprietarios`. Tudo embutido e opcional.
 * v6: Ativo e Unidade ganharam `documentos` (links externos); Ativo ganhou `foreiro`,
 *     `enfiteuta`, `valorPartilha`, `valorAvaliacaoFiscal` e `fonteValores`. Embutido e opcional.
 * v7: ComparavelImobiliario ganhou `url` (link do anúncio de origem). Opcional e aditivo.
 * v8: Evidencia/Hipotese passaram a `pilares: Pilar[]` (era `pilar`) e Evidencia a
 *     `vinculos: {hipoteseId,efeito}[]` (era `hipoteseId`). Backups antigos (v≤7) são
 *     normalizados no import (pilar→[pilar], hipoteseId→[{…,'sustenta'}]).
 * v9: Evidencia/Hipotese ganharam `codigo` (EV-{n}/HIP-{n}) e `codigoLegado`. Backups
 *     sem `codigo` (v≤8) recebem código atribuído no import (+ semeia os contadores).
 * v10: ComparavelImobiliario ganhou `bairro` e `codigo` (metadados). Opcionais e aditivos.
 * Sempre retrocompatível: campos novos são opcionais e backups antigos continuam importáveis.
 */
export const BACKUP_SCHEMA_VERSION = 10;

export async function montarBackup(): Promise<BackupCompleto> {
  const [
    ativos, stakeholders, evidencias, hipoteses, oportunidades,
    businessCases, decisoes, tarefas, kpis, analises, comparaveis, config,
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
    db.analises.toArray(),
    db.comparaveis.toArray(),
    db.config.toArray(),
  ]);
  return {
    app: 'masterplan-sao-borja',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportadoEm: agora(),
    ativos, stakeholders, evidencias, hipoteses, oportunidades,
    businessCases, decisoes, tarefas, kpis, analises, comparaveis, config,
  };
}

export function ehBackupValido(dados: unknown): dados is BackupCompleto {
  if (!dados || typeof dados !== 'object') return false;
  const o = dados as Record<string, unknown>;
  return o.app === 'masterplan-sao-borja' && Array.isArray(o.ativos) && Array.isArray(o.stakeholders);
}

/**
 * Normaliza uma evidência de backup antigo (v≤7) para o modelo atual:
 * `pilar`→`pilares`, `hipoteseId`→`vinculos`. Registros já novos passam intactos.
 */
function normalizarEvidencia(e: Evidencia): Evidencia {
  const { pilar: _p, hipoteseId: _h, ...rest } = e;
  return { ...rest, pilares: pilaresDe(e), vinculos: vinculosDe(e) };
}
/** Idem para hipótese: `pilar`→`pilares`. */
function normalizarHipotese(h: Hipotese): Hipotese {
  const { pilar: _p, ...rest } = h;
  return { ...rest, pilares: pilaresDe(h) };
}

/** Aplica os patches de código (codigo/codigoLegado/texto limpo) a uma lista. */
function aplicarCodigos<T extends { id: string }>(lista: T[], patches: PatchCodigo[], campo: 'conteudo' | 'enunciado'): T[] {
  const byId = new Map(patches.map((p) => [p.id, p]));
  return lista.map((r) => {
    const p = byId.get(r.id);
    if (!p) return r;
    const out: Record<string, unknown> = { ...r, codigo: p.codigo };
    if (p.codigoLegado !== undefined) { out.codigoLegado = p.codigoLegado; out[campo] = p.textoLimpo; }
    return out as T;
  });
}

/** Substitui todos os dados de domínio pelo conteúdo do backup (transacional). */
export async function restaurarBackup(backup: BackupCompleto): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.ativos, db.stakeholders, db.evidencias, db.hipoteses, db.oportunidades,
      db.businessCases, db.decisoes, db.tarefas, db.kpis, db.analises, db.comparaveis, db.config,
    ],
    async () => {
      await limparTudo();
      await db.analises.clear();
      await db.comparaveis.clear();
      await db.config.clear();

      let evs = (backup.evidencias ?? []).map(normalizarEvidencia);
      let hips = (backup.hipoteses ?? []).map(normalizarHipotese);
      let config: Config[] = backup.config ?? [];
      // Backup anterior à Fase 2 (todos sem `codigo`): atribui código + semeia contadores.
      // Guardado por `every` — se já houver código (backup ≥ v9), não reatribui (imutável).
      if (evs.length && evs.every((e) => !e.codigo)) {
        const plan = planejarCodigos(evs, 'EV', (e) => e.conteudo);
        evs = aplicarCodigos(evs, plan.patches, 'conteudo');
        config = [...config.filter((c) => c.chave !== CONFIG_PROX_EV), { chave: CONFIG_PROX_EV, valor: plan.prox }];
      }
      if (hips.length && hips.every((h) => !h.codigo)) {
        const plan = planejarCodigos(hips, 'HIP', (h) => h.enunciado);
        hips = aplicarCodigos(hips, plan.patches, 'enunciado');
        config = [...config.filter((c) => c.chave !== CONFIG_PROX_HIP), { chave: CONFIG_PROX_HIP, valor: plan.prox }];
      }

      await Promise.all([
        db.ativos.bulkAdd(backup.ativos ?? []),
        db.stakeholders.bulkAdd(backup.stakeholders ?? []),
        db.evidencias.bulkAdd(evs),
        db.hipoteses.bulkAdd(hips),
        db.oportunidades.bulkAdd(backup.oportunidades ?? []),
        db.businessCases.bulkAdd(backup.businessCases ?? []),
        db.decisoes.bulkAdd(backup.decisoes ?? []),
        db.tarefas.bulkAdd(backup.tarefas ?? []),
        db.kpis.bulkAdd(backup.kpis ?? []),
        db.analises.bulkAdd(backup.analises ?? []),
        db.comparaveis.bulkAdd(backup.comparaveis ?? []),
        db.config.bulkAdd(config),
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
    e.id, e.tipo, e.conteudo, pilaresDe(e).join('|'), e.fonte, e.fonteDetalhe ?? '', e.confianca, e.data,
  ]);
  return montarCSV(cab, linhas);
}
