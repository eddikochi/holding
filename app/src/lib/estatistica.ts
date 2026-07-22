/** Estatística de apoio — funções puras, testáveis sem browser. */

/** Mediana de uma lista. Conjunto par → média dos dois centrais. Vazio → null. */
export function mediana(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const meio = Math.floor(s.length / 2);
  return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2;
}
