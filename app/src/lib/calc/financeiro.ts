/**
 * Cálculos financeiros do business case — funções puras, transparentes.
 * Sem fórmulas escondidas: totais somam linhas; payback é CAPEX ÷ lucro anual.
 */
import type { LinhaFinanceira, BusinessCase } from '../../models/types';

/** Soma as linhas com valor numérico. Linhas sem valor não entram (não viram 0 enganoso). */
export function somaLinhas(linhas: LinhaFinanceira[]): number {
  return linhas.reduce((s, l) => s + (l.valor ?? 0), 0);
}

/** Quantas linhas têm valor mas não têm fonte/premissa preenchida (para alerta). */
export function linhasSemFonte(linhas: LinhaFinanceira[]): number {
  return linhas.filter((l) => l.valor != null && !l.fontePremissa.trim()).length;
}

export interface ResumoFinanceiro {
  capexTotal: number;
  opexMensal: number;
  receitaMensal: number;
  lucroMensal: number;
  lucroAnual: number;
  /** Meses para o lucro acumulado cobrir o CAPEX. null quando não faz sentido. */
  paybackMeses: number | null;
}

/**
 * Payback simplificado: CAPEX ÷ lucro mensal (receita − opex), em meses.
 * Se lucro mensal ≤ 0 ou CAPEX = 0, retorna null (a UI explica em vez de mostrar número falso).
 */
export function resumoFinanceiro(bc: BusinessCase): ResumoFinanceiro {
  const capexTotal = somaLinhas(bc.capex);
  const opexMensal = somaLinhas(bc.opex);
  const receitaMensal = somaLinhas(bc.receitas);
  const lucroMensal = receitaMensal - opexMensal;
  const lucroAnual = lucroMensal * 12;
  const paybackMeses = capexTotal > 0 && lucroMensal > 0 ? capexTotal / lucroMensal : null;
  return { capexTotal, opexMensal, receitaMensal, lucroMensal, lucroAnual, paybackMeses };
}
