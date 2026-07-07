/**
 * Cálculos do diagnóstico imobiliário — funções puras, testáveis sem browser.
 * R$/m² médio por tipo, a partir dos comparáveis de mercado.
 */
import type { ComparavelImobiliario, TipoAtivo } from '../../models/types';

export interface MediaPorTipo {
  tipo: TipoAtivo;
  precoM2Medio: number | null; // null quando não há dado suficiente (nunca inventar)
  aluguelM2Medio: number | null;
  amostras: number;
}

/**
 * Média de R$/m² (venda e aluguel) por tipo de imóvel.
 * Só entra no cálculo o comparável que tem m² > 0 e o preço correspondente.
 * Sem dados suficientes → null (a UI mostra estado vazio, não um zero enganoso).
 */
export function mediasPorTipo(comparaveis: ComparavelImobiliario[]): MediaPorTipo[] {
  const grupos = new Map<TipoAtivo, ComparavelImobiliario[]>();
  for (const c of comparaveis) {
    if (!grupos.has(c.tipo)) grupos.set(c.tipo, []);
    grupos.get(c.tipo)!.push(c);
  }

  const resultado: MediaPorTipo[] = [];
  for (const [tipo, itens] of grupos) {
    const precos = itens
      .filter((c) => c.m2 && c.m2 > 0 && c.precoPedido && c.precoPedido > 0)
      .map((c) => c.precoPedido! / c.m2!);
    const alugueis = itens
      .filter((c) => c.m2 && c.m2 > 0 && c.aluguelMensal && c.aluguelMensal > 0)
      .map((c) => c.aluguelMensal! / c.m2!);
    resultado.push({
      tipo,
      precoM2Medio: precos.length ? media(precos) : null,
      aluguelM2Medio: alugueis.length ? media(alugueis) : null,
      amostras: itens.length,
    });
  }
  return resultado.sort((a, b) => b.amostras - a.amostras);
}

function media(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
