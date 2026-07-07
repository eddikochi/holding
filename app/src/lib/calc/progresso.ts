/**
 * Progresso por módulo — função pura, testável sem browser.
 * Fase 1: heurística simples baseada em existência de dados por pilar.
 * Fases seguintes refinam por completude de campos.
 */
import type { Pilar } from '../../models/types';

export interface ContagensPorPilar {
  ativos: number;
  stakeholders: number;
  evidencias: number;
  hipoteses: number;
}

/**
 * % de preenchimento de um módulo de diagnóstico (0–100).
 * Regra Fase 1: cada tipo de dado presente vale um quinhão; sem dados = 0.
 * Não inventa progresso — 0 dados retorna 0.
 */
export function progressoModulo(c: ContagensPorPilar): number {
  const sinais = [c.ativos > 0, c.stakeholders > 0, c.evidencias > 0, c.hipoteses > 0];
  const marcados = sinais.filter(Boolean).length;
  return Math.round((marcados / sinais.length) * 100);
}

/** Agrupa contagens por pilar a partir de listas planas. */
export function contarPorPilar(
  stakeholders: { pilar: Pilar }[],
  evidencias: { pilar: Pilar }[],
  hipoteses: { pilar: Pilar }[]
): Record<Pilar, ContagensPorPilar> {
  const base = (): ContagensPorPilar => ({ ativos: 0, stakeholders: 0, evidencias: 0, hipoteses: 0 });
  const acc = {
    patrimonial: base(), juridico: base(), imobiliario: base(), economico: base(),
    logistico: base(), agroindustrial: base(), turistico: base(),
  } as Record<Pilar, ContagensPorPilar>;
  for (const s of stakeholders) acc[s.pilar].stakeholders++;
  for (const e of evidencias) acc[e.pilar].evidencias++;
  for (const h of hipoteses) acc[h.pilar].hipoteses++;
  return acc;
}
