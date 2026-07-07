/** Formatação de datas para exibição pt-BR. Armazenamento é sempre ISO 8601. */
export function fmtData(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function fmtDataHora(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

/** Carimbo compacto para nomes de arquivo. */
export function carimboArquivo(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}
