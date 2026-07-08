/**
 * Score composto de priorização — função pura, testável sem browser.
 * Impacto puxa para cima; investimento e risco puxam para baixo. Pesos ajustáveis.
 */
import type { Oportunidade } from '../../models/types';

export interface PesosPriorizacao {
  impacto: number;
  investimento: number;
  risco: number;
}

/**
 * score = wImpacto*impacto − wInvestimento*investimento − wRisco*risco
 * Notas 1–5. Oportunidade sem impacto definido não entra no ranking (retorna null).
 * Transparente de propósito: sem fórmula escondida.
 */
export function scoreComposto(o: Oportunidade, pesos: PesosPriorizacao): number | null {
  if (o.impacto == null) return null;
  const inv = o.investimento ?? 0;
  const risco = o.risco ?? 0;
  return pesos.impacto * o.impacto - pesos.investimento * inv - pesos.risco * risco;
}

export interface OportunidadeComScore {
  oportunidade: Oportunidade;
  score: number | null;
}

/** Ordena oportunidades pelo score (desc). Sem score vão para o fim. */
export function rankearOportunidades(
  oportunidades: Oportunidade[],
  pesos: PesosPriorizacao
): OportunidadeComScore[] {
  return oportunidades
    .map((o) => ({ oportunidade: o, score: scoreComposto(o, pesos) }))
    .sort((a, b) => {
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      return b.score - a.score;
    });
}

export type QuadranteMatriz = 'quick_wins' | 'apostas_grandes' | 'preencher_tempo' | 'descartar';

/**
 * Quadrante da matriz Impacto × Esforço. Alto = nota ≥ 3.
 * Usa posicaoMatriz se definida (drag manual); senão deriva de impacto/esforço.
 */
export function quadranteDe(o: Oportunidade): QuadranteMatriz | null {
  let impactoAlto: boolean;
  let esforcoAlto: boolean;
  if (o.posicaoMatriz) {
    impactoAlto = o.posicaoMatriz.x >= 0.5;
    esforcoAlto = o.posicaoMatriz.y >= 0.5;
  } else {
    if (o.impacto == null || o.esforco == null) return null;
    impactoAlto = o.impacto >= 3;
    esforcoAlto = o.esforco >= 3;
  }
  if (impactoAlto && !esforcoAlto) return 'quick_wins';
  if (impactoAlto && esforcoAlto) return 'apostas_grandes';
  if (!impactoAlto && !esforcoAlto) return 'preencher_tempo';
  return 'descartar';
}
