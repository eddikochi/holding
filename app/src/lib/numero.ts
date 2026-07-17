/**
 * Lê texto digitado (vírgula OU ponto) para número. Celular pt-BR digita vírgula.
 * Vazio ou inválido → undefined (nunca 0 — no projeto, campo apagado ≠ zero).
 * Só converte; não arredonda. Arredondamento de casas é responsabilidade da UI.
 */
export function parseNumeroBR(v: string): number | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (s === '') return undefined;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}
