import { useState, type ReactNode } from 'react';

export interface Aba {
  id: string;
  rotulo: string;
  conteudo: ReactNode;
}

/** Abas acessíveis (role=tab), navegáveis por teclado. */
export function Tabs({ abas, inicial }: { abas: Aba[]; inicial?: string }) {
  const [ativa, setAtiva] = useState(inicial ?? abas[0]?.id);
  return (
    <div>
      <div role="tablist" className="tabs-bar">
        {abas.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={ativa === a.id}
            className={'tab-btn' + (ativa === a.id ? ' active' : '')}
            onClick={() => setAtiva(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel">{abas.find((a) => a.id === ativa)?.conteudo}</div>
    </div>
  );
}
