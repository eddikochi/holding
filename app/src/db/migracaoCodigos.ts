/**
 * Migração 2.2 (Fase 2) — atribuição do código estruturado `EV-{n}`/`HIP-{n}`.
 * Lógica PURA (sem Dexie): usada tanto pelo upgrade Dexie v5 quanto pelo dry-run
 * de verificação sobre o backup. Determinística — mesma entrada, mesma saída.
 *
 * Regras (aprovadas — opção (a) do Gate 1 da Fase 2):
 * - Registros COM código manual no texto recebem os números baixos (ordenados por
 *   createdAt), os SEM código continuam a sequência. Números manuais NÃO são
 *   preservados (colidem) — o código antigo vai para `codigoLegado` como rastro.
 * - O prefixo é removido do texto (`conteudo`/`enunciado`), tolerante às variações
 *   de delimitador ( `]---`, `] ---`, `] ---  `, com espaços/tabs).
 */

/** Captura o código manual no início do texto + o resto do delimitador a remover. */
const RX_CODIGO = /^\s*\[((?:EV|HIP)-[^\]]*)\]\s*-{0,3}\s*/;

/** Extrai o código legado e o texto limpo, ou null se não houver código no início. */
export function extrairCodigo(texto: string | undefined): { codigoLegado: string; textoLimpo: string } | null {
  const t = texto ?? '';
  const m = RX_CODIGO.exec(t);
  if (!m) return null;
  return { codigoLegado: m[1].trim(), textoLimpo: t.slice(m[0].length) };
}

export interface PatchCodigo {
  id: string;
  codigo: string;
  codigoLegado?: string;
  /** Novo texto sem o prefixo (só presente quando havia código a limpar). */
  textoLimpo?: string;
}

interface RegistroBase { id: string; createdAt: string }

/** createdAt asc, empate por id — ordem total e determinística. */
function cmp(a: RegistroBase, b: RegistroBase): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Planeja os códigos de uma lista (evidências OU hipóteses). Não toca em banco.
 * Retorna um patch por registro e o próximo número livre (para semear o contador).
 */
export function planejarCodigos<T extends RegistroBase>(
  registros: T[],
  prefixo: 'EV' | 'HIP',
  campoTexto: (r: T) => string | undefined,
): { patches: PatchCodigo[]; prox: number } {
  const info = registros.map((r) => ({ r, ex: extrairCodigo(campoTexto(r)) }));
  const comCodigo = info.filter((x) => x.ex).sort((a, b) => cmp(a.r, b.r));
  const semCodigo = info.filter((x) => !x.ex).sort((a, b) => cmp(a.r, b.r));
  const ordenado = [...comCodigo, ...semCodigo];
  const patches: PatchCodigo[] = ordenado.map((x, i) => ({
    id: x.r.id,
    codigo: `${prefixo}-${i + 1}`,
    ...(x.ex ? { codigoLegado: x.ex.codigoLegado, textoLimpo: x.ex.textoLimpo } : {}),
  }));
  return { patches, prox: ordenado.length + 1 };
}
