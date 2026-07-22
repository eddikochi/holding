/** Ordenação por código estruturado 'EV-{n}'/'HIP-{n}' — numérica, não alfabética. */

/** Número do código (parte após o último '-'); sem código vai para o fim. */
export function numeroCodigo(codigo?: string): number {
  if (!codigo) return Number.POSITIVE_INFINITY;
  const m = /(\d+)\s*$/.exec(codigo);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

/** Comparador ascendente por número do código (EV-2 antes de EV-10). */
export function compararCodigo(a?: string, b?: string): number {
  return numeroCodigo(a) - numeroCodigo(b);
}
