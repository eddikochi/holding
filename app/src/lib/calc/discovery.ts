/**
 * Cálculos do funil de discovery por pilar — funções puras, testáveis sem browser.
 * Vale para qualquer pilar (não só o logístico).
 */
import type { Hipotese, Evidencia, StatusHipotese } from '../../models/types';

export interface FunilPilar {
  total: number;
  comEvidencia: number;
  naoValidada: number;
  parcial: number;
  validada: number;
  refutada: number;
}

/** Conta as hipóteses do pilar por situação, e quantas têm ao menos 1 evidência. */
export function funilDoPilar(hipoteses: Hipotese[], evidencias: Evidencia[]): FunilPilar {
  const comEv = new Set(evidencias.filter((e) => e.hipoteseId).map((e) => e.hipoteseId!));
  const conta = (s: StatusHipotese) => hipoteses.filter((h) => h.status === s).length;
  return {
    total: hipoteses.length,
    comEvidencia: hipoteses.filter((h) => comEv.has(h.id)).length,
    naoValidada: conta('nao_validada'),
    parcial: conta('parcial'),
    validada: conta('validada'),
    refutada: conta('refutada'),
  };
}

/** Nº de evidências vinculadas a uma hipótese. */
export function evidenciasDaHipotese(hipoteseId: string, evidencias: Evidencia[]): Evidencia[] {
  return evidencias.filter((e) => e.hipoteseId === hipoteseId);
}
