/**
 * Progresso por módulo — função pura, testável sem browser.
 * Fase 1: heurística simples baseada em existência de dados por pilar.
 * Fases seguintes refinam por completude de campos.
 */
import type { Pilar, Unidade } from '../../models/types';

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

/**
 * Resumo dos dados usados no cálculo de progresso dos diagnósticos.
 * Só campos que os módulos de fato usam (ver docs/PROGRESSO.md).
 */
export interface ResumoModulos {
  ativos: number;
  ativosComJuridico: number; // ativos com ≥1 item jurídico avaliado (status ≠ nao_iniciado)
  ativosComCenario: number; // ativos com ≥1 cenário de uso preenchido
  comparaveis: number;
  sazonalidadeAtiva: boolean; // agro: ≥1 mês com intensidade ≠ nenhuma
  subdivididos: number; // ativos marcados como subdivididos (ehSubdividido)
  subdivididosPendentes: number; // subdivididos sem unidades OU com ≥1 unidade vazia
  porPilar: Record<Pilar, ContagensPorPilar>;
}

/**
 * Uma unidade conta como "preenchida" se tem nome e ao menos um dado de negócio
 * (locatário, estado físico, situação jurídica ou algum potencial por pilar).
 * Serve para o progresso não marcar um prédio subdividido como completo enquanto
 * suas unidades ainda estão vazias. Função pura.
 */
export function unidadePreenchida(u: Unidade): boolean {
  const temNome = (u.nome ?? '').trim() !== '';
  const temPotencial = !!u.potencialPorPilar
    && Object.values(u.potencialPorPilar).some((v) => (v ?? '').trim() !== '');
  const temNegocio =
    (u.locatario ?? '').trim() !== '' ||
    (u.estadoFisico ?? '').trim() !== '' ||
    (u.situacaoJuridicaResumo ?? '').trim() !== '' ||
    temPotencial;
  return temNome && temNegocio;
}

/**
 * Sinais de "dados presentes" de um diagnóstico — só as entidades que o módulo usa.
 * Cada sinal (true/false) vale uma fatia igual do componente "Dados".
 */
export function sinaisDadosDiagnostico(slug: string, r: ResumoModulos): boolean[] {
  const p = r.porPilar;
  switch (slug) {
    // Patrimonial: tem ativo E nenhum prédio subdividido com unidades por preencher.
    // Sem ativos subdivididos, subdivididosPendentes = 0 → sinal sempre true (retrocompatível).
    case 'patrimonial': return [r.ativos > 0, r.subdivididosPendentes === 0];
    case 'juridico': return [r.ativosComJuridico > 0];
    case 'imobiliario': return [r.comparaveis > 0, r.ativosComCenario > 0];
    case 'economico': return [p.economico.evidencias > 0];
    case 'logistico': return [p.logistico.stakeholders > 0, p.logistico.evidencias > 0, p.logistico.hipoteses > 0];
    case 'agroindustrial': return [p.agroindustrial.stakeholders > 0, p.agroindustrial.evidencias > 0, r.sazonalidadeAtiva];
    case 'turistico': return [p.turistico.evidencias > 0];
    case 'educacao': return [p.educacao.stakeholders > 0, p.educacao.evidencias > 0, p.educacao.hipoteses > 0];
    default: return [];
  }
}

/**
 * Progresso de um diagnóstico (0–100) = média de dois componentes:
 *  - Dados: % dos tipos de dado do módulo que têm ao menos um registro.
 *  - Checklist: % de itens do checklist de discovery marcados.
 * Média 50/50, transparente e explicável (docs/PROGRESSO.md).
 */
export function progressoDiagnostico(sinaisDados: boolean[], checklistPct: number): number {
  const dadosPct = sinaisDados.length ? (sinaisDados.filter(Boolean).length / sinaisDados.length) * 100 : 0;
  return Math.round((dadosPct + checklistPct) / 2);
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
    logistico: base(), agroindustrial: base(), turistico: base(), educacao: base(),
  } as Record<Pilar, ContagensPorPilar>;
  for (const s of stakeholders) acc[s.pilar].stakeholders++;
  for (const e of evidencias) acc[e.pilar].evidencias++;
  for (const h of hipoteses) acc[h.pilar].hipoteses++;
  return acc;
}
