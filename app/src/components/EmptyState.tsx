import type { ReactNode } from 'react';

/** Estado vazio útil: sempre diz o que fazer e de onde vêm os dados. */
export function EmptyState({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{titulo}</h3>
      <p>{children}</p>
      {acao && <div style={{ marginTop: 12 }}>{acao}</div>}
    </div>
  );
}
