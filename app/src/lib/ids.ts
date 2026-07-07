/** Geração de IDs locais. Sem dependências externas. */
export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // fallback para ambientes sem crypto.randomUUID
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function agora(): string {
  return new Date().toISOString();
}
