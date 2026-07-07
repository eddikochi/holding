/**
 * Cálculos do diagnóstico logístico — funções puras, testáveis sem browser.
 * Ranking de dores e funil hipótese → evidência → validação.
 */
import type { Stakeholder, Hipotese, Evidencia } from '../../models/types';

export interface DorContada {
  dor: string;
  contagem: number;
}

/**
 * Ranking de dores a partir dos stakeholders. A dor pode vir como
 * "Categoria — detalhe" (import do Hub) ou texto livre; contamos pela
 * categoria (antes de " — ") e também aceitamos várias separadas por ";".
 */
export function rankingDeDores(stakeholders: Stakeholder[]): DorContada[] {
  const mapa = new Map<string, number>();
  for (const s of stakeholders) {
    if (!s.dorOportunidade) continue;
    for (const parte of s.dorOportunidade.split(';')) {
      const categoria = parte.split(' — ')[0].trim();
      if (!categoria) continue;
      mapa.set(categoria, (mapa.get(categoria) ?? 0) + 1);
    }
  }
  return [...mapa.entries()]
    .map(([dor, contagem]) => ({ dor, contagem }))
    .sort((a, b) => b.contagem - a.contagem);
}

export interface HipoteseComEvidencias {
  hipotese: Hipotese;
  evidenciasVinculadas: number;
  atingeMinimo: boolean;
}

/** Para cada hipótese, conta evidências vinculadas e se atinge o mínimo para validar. */
export function hipotesesComContagem(
  hipoteses: Hipotese[],
  evidencias: Evidencia[],
  minEvidencias: number
): HipoteseComEvidencias[] {
  const porHipotese = new Map<string, number>();
  for (const e of evidencias) {
    if (e.hipoteseId) porHipotese.set(e.hipoteseId, (porHipotese.get(e.hipoteseId) ?? 0) + 1);
  }
  return hipoteses.map((h) => {
    const n = porHipotese.get(h.id) ?? 0;
    return { hipotese: h, evidenciasVinculadas: n, atingeMinimo: n >= minEvidencias };
  });
}

export interface EtapasFunil {
  hipoteses: number;
  evidenciasVinculadas: number;
  hipotesesValidadas: number;
  businessCases: number; // preenchido na Fase 4; 0 por enquanto
}

/** Contagens agregadas para o funil hipótese → evidência → validação → business case. */
export function etapasDoFunil(
  hipoteses: Hipotese[],
  evidencias: Evidencia[],
  businessCases = 0
): EtapasFunil {
  const idsHip = new Set(hipoteses.map((h) => h.id));
  const evVinc = evidencias.filter((e) => e.hipoteseId && idsHip.has(e.hipoteseId)).length;
  const validadas = hipoteses.filter((h) => h.status === 'validada').length;
  return {
    hipoteses: hipoteses.length,
    evidenciasVinculadas: evVinc,
    hipotesesValidadas: validadas,
    businessCases,
  };
}
