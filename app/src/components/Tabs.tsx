import { useState, type ReactNode } from 'react';

export interface Aba {
  id: string;
  rotulo: string;
  conteudo: ReactNode;
}

/**
 * Abas acessíveis (role=tab), navegáveis por teclado.
 * Modo não-controlado (usa `inicial`) ou controlado (passe `ativa` + `aoMudar`).
 */
export function Tabs({ abas, inicial, ativa, aoMudar }: {
  abas: Aba[];
  inicial?: string;
  ativa?: string;
  aoMudar?: (id: string) => void;
}) {
  const [interna, setInterna] = useState(inicial ?? abas[0]?.id);
  const atual = ativa ?? interna;
  function selecionar(id: string) {
    if (aoMudar) aoMudar(id);
    if (ativa === undefined) setInterna(id);
  }
  return (
    <div>
      <div role="tablist" className="tabs-bar">
        {abas.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={atual === a.id}
            className={'tab-btn' + (atual === a.id ? ' active' : '')}
            onClick={() => selecionar(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel">{abas.find((a) => a.id === atual)?.conteudo}</div>
    </div>
  );
}
