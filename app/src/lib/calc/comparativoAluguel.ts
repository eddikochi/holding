/**
 * Fase 5 — comparativo R$/m² de aluguel: NOSSAS UNIDADES × mediana de mercado, por tipo.
 * Derivação pura, testável sem browser. Só leitura, sem schema (Opção B: mapa unidade→tipo
 * em Config; ver salvarTipoComparacaoUnidade / CONFIG_IMOB_UNIDADE_TIPO).
 *
 * R$/m² de uma unidade = valorAluguel (mensal) ÷ metragens.construidaM2. 0 ≠ vazio.
 * A mediana de mercado por tipo vem dos comparáveis (aluguelMensal ÷ m²), mesma conta do
 * módulo Imobiliário. Comparáveis/unidades sem os dois números saem da conta.
 *
 * Estados por unidade (regras confirmadas no Gate 1):
 *  - 'plota'        : tem aluguel E área E existe mediana do tipo → calcula e compara.
 *  - 'alerta_falta' : tem aluguel mas NÃO tem área → mostra alerta "falta área p/ R$/m²".
 *  - 'ausente'      : não tem aluguel → nada a comparar, fica de fora (contado à parte).
 *  - 'sem_mercado'  : tem aluguel E área, mas o tipo não tem comparável de mercado
 *                     (ex.: oficina/terreno) → mostra o nosso número, sem barra de mercado.
 */
import { mediana } from '../estatistica';
import type { Ativo, ComparavelImobiliario, TipoAtivo } from '../../models/types';

export type EstadoUnidade = 'plota' | 'alerta_falta' | 'ausente' | 'sem_mercado';

export interface LinhaComparativo {
  unidadeId: string;
  nome: string;
  ativoNome: string;
  aluguel?: number;
  area?: number;
  /** R$/m² da unidade (aluguel ÷ área). undefined quando falta dado. */
  rpm?: number;
  /** Tipo de mercado escolhido para comparar (do mapa, ou tipo do ativo pai). */
  tipoComparacao: TipoAtivo;
  /** Mediana de mercado do tipo escolhido. undefined = sem comparável para o tipo. */
  medianaMercado?: number;
  /** rpm − mediana (R$/m²). Positivo = acima do mercado. undefined se não plota. */
  delta?: number;
  /** delta em % da mediana. undefined se não plota. */
  deltaPct?: number;
  estado: EstadoUnidade;
}

export interface ComparativoAluguel {
  linhas: LinhaComparativo[];
  medianasPorTipo: Partial<Record<TipoAtivo, number>>;
  /** Faixa de R$/m² (nossos + medianas) para escalar as barras. */
  maxRpm: number;
  contagens: { plota: number; alertaFalta: number; ausente: number; semMercado: number };
}

/** R$/m² de aluguel de um comparável (mesma regra do módulo Imobiliário). */
function rpmComparavel(c: ComparavelImobiliario): number | undefined {
  return c.m2 && c.m2 > 0 && c.aluguelMensal && c.aluguelMensal > 0 ? c.aluguelMensal / c.m2 : undefined;
}

/** Mediana de R$/m² de mercado por tipo (só tipos com ≥1 comparável válido). */
export function medianasDeMercado(comparaveis: ComparavelImobiliario[]): Partial<Record<TipoAtivo, number>> {
  const porTipo = new Map<TipoAtivo, number[]>();
  for (const c of comparaveis) {
    const v = rpmComparavel(c);
    if (v == null) continue;
    const arr = porTipo.get(c.tipo) ?? [];
    arr.push(v);
    porTipo.set(c.tipo, arr);
  }
  const out: Partial<Record<TipoAtivo, number>> = {};
  for (const [tipo, vals] of porTipo) {
    const m = mediana(vals);
    if (m != null) out[tipo] = m;
  }
  return out;
}

/**
 * Monta o comparativo por unidade. Percorre as unidades dos ativos subdivididos.
 * `mapaTipo` = Config unidade→tipo (Opção B); ausente → usa o tipo do ativo pai.
 */
export function comparativoAluguelPorUnidade(
  ativos: Ativo[],
  comparaveis: ComparavelImobiliario[],
  mapaTipo: Record<string, TipoAtivo>
): ComparativoAluguel {
  const medianas = medianasDeMercado(comparaveis);
  const linhas: LinhaComparativo[] = [];

  for (const a of ativos) {
    for (const u of a.unidades ?? []) {
      const aluguel = positivo(u.valorAluguel);
      const area = positivo(u.metragens?.construidaM2);
      const tipoComparacao = mapaTipo[u.id] ?? a.tipo;
      const medianaMercado = medianas[tipoComparacao];

      const base: LinhaComparativo = {
        unidadeId: u.id,
        nome: u.nome,
        ativoNome: a.nome,
        aluguel,
        area,
        tipoComparacao,
        medianaMercado,
        estado: 'ausente',
      };

      if (aluguel == null) {
        linhas.push({ ...base, estado: 'ausente' });
        continue;
      }
      if (area == null) {
        linhas.push({ ...base, estado: 'alerta_falta' });
        continue;
      }
      const rpm = aluguel / area;
      if (medianaMercado == null) {
        linhas.push({ ...base, rpm, estado: 'sem_mercado' });
        continue;
      }
      const delta = rpm - medianaMercado;
      linhas.push({
        ...base,
        rpm,
        delta,
        deltaPct: (delta / medianaMercado) * 100,
        estado: 'plota',
      });
    }
  }

  const maxRpm = Math.max(
    0,
    ...linhas.map((l) => l.rpm ?? 0),
    ...Object.values(medianas)
  );
  const contagens = {
    plota: linhas.filter((l) => l.estado === 'plota').length,
    alertaFalta: linhas.filter((l) => l.estado === 'alerta_falta').length,
    ausente: linhas.filter((l) => l.estado === 'ausente').length,
    semMercado: linhas.filter((l) => l.estado === 'sem_mercado').length,
  };

  return { linhas, medianasPorTipo: medianas, maxRpm, contagens };
}

/** Número > 0, senão undefined (0 ≠ vazio). */
function positivo(n: number | undefined | null): number | undefined {
  return typeof n === 'number' && n > 0 ? n : undefined;
}
