/**
 * Cálculos do funil de discovery por pilar — funções puras, testáveis sem browser.
 * Vale para qualquer pilar (não só o logístico).
 */
import { vinculosDe } from '../../models/types';
import type { Hipotese, Evidencia, StatusHipotese, EfeitoVinculo } from '../../models/types';

export interface FunilPilar {
  total: number;
  comEvidencia: number; // hipóteses com ≥1 evidência que SUSTENTA
  comRefuta: number;    // hipóteses com ≥1 evidência que REFUTA
  naoValidada: number;
  parcial: number;
  validada: number;
  refutada: number;
}

/** Conta as hipóteses por situação; "com evidência" = com ≥1 vínculo que sustenta. */
export function funilDoPilar(hipoteses: Hipotese[], evidencias: Evidencia[]): FunilPilar {
  const sustentam = new Set<string>();
  const refutam = new Set<string>();
  for (const e of evidencias) {
    for (const v of vinculosDe(e)) {
      if (v.efeito === 'sustenta') sustentam.add(v.hipoteseId);
      else if (v.efeito === 'refuta') refutam.add(v.hipoteseId);
    }
  }
  const conta = (s: StatusHipotese) => hipoteses.filter((h) => h.status === s).length;
  return {
    total: hipoteses.length,
    comEvidencia: hipoteses.filter((h) => sustentam.has(h.id)).length,
    comRefuta: hipoteses.filter((h) => refutam.has(h.id)).length,
    naoValidada: conta('nao_validada'),
    parcial: conta('parcial'),
    validada: conta('validada'),
    refutada: conta('refutada'),
  };
}

/** Nº de vínculos por efeito para UMA hipótese. */
export function contarEfeitos(hipoteseId: string, evidencias: Evidencia[]): { sustenta: number; refuta: number; neutro: number } {
  const acc = { sustenta: 0, refuta: 0, neutro: 0 };
  for (const e of evidencias) {
    for (const v of vinculosDe(e)) {
      if (v.hipoteseId === hipoteseId) acc[v.efeito]++;
    }
  }
  return acc;
}

/** Efeito do vínculo de uma evidência a uma hipótese (undefined se não vinculada). */
export function efeitoDe(e: Evidencia, hipoteseId: string): EfeitoVinculo | undefined {
  return vinculosDe(e).find((v) => v.hipoteseId === hipoteseId)?.efeito;
}

/** Nº de evidências vinculadas a uma hipótese (qualquer efeito). */
export function evidenciasDaHipotese(hipoteseId: string, evidencias: Evidencia[]): Evidencia[] {
  return evidencias.filter((e) => vinculosDe(e).some((v) => v.hipoteseId === hipoteseId));
}
