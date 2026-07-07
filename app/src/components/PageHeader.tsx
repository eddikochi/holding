import type { ReactNode } from 'react';

/** Cabeçalho padrão de página: kicker + título + descrição + ações à direita. */
export function PageHeader({
  kicker,
  titulo,
  descricao,
  acoes,
}: {
  kicker?: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          {kicker && <div className="kicker">{kicker}</div>}
          <h1>{titulo}</h1>
        </div>
        {acoes && <div className="row-actions">{acoes}</div>}
      </div>
      {descricao && <p className="desc">{descricao}</p>}
    </div>
  );
}
