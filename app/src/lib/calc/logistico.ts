/**
 * Cálculos do diagnóstico logístico — funções puras, testáveis sem browser.
 * Ranking de dores e funil hipótese → evidência → validação.
 */
import { vinculosDe } from '../../models/types';
import type { Stakeholder, Hipotese, Evidencia } from '../../models/types';

export interface DorContada {
  dor: string;
  contagem: number;
  /** Segmentos (tipos de player) de origem desta dor — para a lista sem barra. */
  segmentos: string[];
}

/**
 * Ranking de dores a partir dos stakeholders. A dor pode vir como
 * "Categoria — detalhe" (import do Hub) ou texto livre; contamos pela
 * categoria (antes de " — ") e também aceitamos várias separadas por ";".
 * Guarda os segmentos de origem para a lista simples (desk, sem barra).
 */
export function rankingDeDores(stakeholders: Stakeholder[]): DorContada[] {
  const mapa = new Map<string, { contagem: number; segmentos: Set<string> }>();
  for (const s of stakeholders) {
    if (!s.dorOportunidade) continue;
    for (const parte of s.dorOportunidade.split(';')) {
      const categoria = parte.split(' — ')[0].trim();
      if (!categoria) continue;
      const e = mapa.get(categoria) ?? { contagem: 0, segmentos: new Set<string>() };
      e.contagem++;
      if (s.segmento) e.segmentos.add(s.segmento);
      mapa.set(categoria, e);
    }
  }
  return [...mapa.entries()]
    .map(([dor, e]) => ({ dor, contagem: e.contagem, segmentos: [...e.segmentos] }))
    .sort((a, b) => b.contagem - a.contagem);
}

/**
 * Relevância de um player para a jogada de curto prazo (armazenagem/overflow) vs.
 * a tese de hub (fronteira, binacional, ecommerce). DERIVADA de texto livre
 * (dorOportunidade + segmento) — heurística de leitura, não persistida.
 */
export type RelevanciaLog = 'curto' | 'hub' | 'indef';
export function relevanciaCurtoPrazo(s: { dorOportunidade?: string; segmento?: string }): RelevanciaLog {
  const t = `${s.dorOportunidade ?? ''} ${s.segmento ?? ''}`.toLowerCase();
  // Sinais de hub são mais decisivos (ex.: ecommerce cita "mini estoque" mas é tese de hub),
  // por isso vêm primeiro.
  if (/fulfillment|aduaneir|fronteira|binacional|ecommerce|e-commerce|argentin/.test(t)) return 'hub';
  if (/armazen|overflow|estoque|garagem/.test(t)) return 'curto';
  return 'indef';
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
    for (const v of vinculosDe(e)) porHipotese.set(v.hipoteseId, (porHipotese.get(v.hipoteseId) ?? 0) + 1);
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
  const evVinc = evidencias.filter((e) => vinculosDe(e).some((v) => idsHip.has(v.hipoteseId))).length;
  const validadas = hipoteses.filter((h) => h.status === 'validada').length;
  return {
    hipoteses: hipoteses.length,
    evidenciasVinculadas: evVinc,
    hipotesesValidadas: validadas,
    businessCases,
  };
}
