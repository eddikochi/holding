import { useState } from 'react';
import type { Swot, SwotItem, QuadranteSwot } from '../models/types';
import { novoId } from '../lib/ids';

const QUADRANTES: { chave: QuadranteSwot; rotulo: string; cor: string }[] = [
  { chave: 'forcas', rotulo: 'Forças', cor: 'var(--green)' },
  { chave: 'fraquezas', rotulo: 'Fraquezas', cor: 'var(--red)' },
  { chave: 'oportunidades', rotulo: 'Oportunidades', cor: 'var(--blue)' },
  { chave: 'ameacas', rotulo: 'Ameaças', cor: 'var(--amber)' },
];

/**
 * Editor de SWOT: 4 quadrantes, itens adicionáveis/removíveis e arrastáveis
 * entre quadrantes (drag nativo, sem biblioteca). Chama onChange a cada mudança.
 */
export function SwotEditor({ valor, onChange }: { valor: Swot; onChange: (s: Swot) => void }) {
  const [rascunho, setRascunho] = useState<Record<QuadranteSwot, string>>({
    forcas: '', fraquezas: '', oportunidades: '', ameacas: '',
  });

  function adicionar(q: QuadranteSwot) {
    const texto = rascunho[q].trim();
    if (!texto) return;
    const item: SwotItem = { id: novoId(), texto };
    onChange({ ...valor, [q]: [...valor[q], item] });
    setRascunho({ ...rascunho, [q]: '' });
  }

  function remover(q: QuadranteSwot, id: string) {
    onChange({ ...valor, [q]: valor[q].filter((i) => i.id !== id) });
  }

  function mover(itemId: string, de: QuadranteSwot, para: QuadranteSwot) {
    if (de === para) return;
    const item = valor[de].find((i) => i.id === itemId);
    if (!item) return;
    onChange({
      ...valor,
      [de]: valor[de].filter((i) => i.id !== itemId),
      [para]: [...valor[para], item],
    });
  }

  return (
    <div className="swot-grid">
      {QUADRANTES.map((q) => (
        <div
          key={q.chave}
          className="swot-quad"
          style={{ borderTopColor: q.cor }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const itemId = e.dataTransfer.getData('itemId');
            const de = e.dataTransfer.getData('de') as QuadranteSwot;
            if (itemId && de) mover(itemId, de, q.chave);
          }}
        >
          <h4 style={{ color: q.cor }}>{q.rotulo}</h4>
          <ul className="swot-list">
            {valor[q.chave].length === 0 && <li className="swot-vazio">Nenhum item ainda.</li>}
            {valor[q.chave].map((item) => (
              <li
                key={item.id}
                className="swot-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('itemId', item.id);
                  e.dataTransfer.setData('de', q.chave);
                }}
              >
                <span>{item.texto}</span>
                <button
                  className="swot-x"
                  aria-label={`Remover "${item.texto}"`}
                  onClick={() => remover(q.chave, item.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="swot-add">
            <input
              type="text"
              value={rascunho[q.chave]}
              placeholder={`Adicionar a ${q.rotulo.toLowerCase()}`}
              aria-label={`Novo item em ${q.rotulo}`}
              onChange={(e) => setRascunho({ ...rascunho, [q.chave]: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionar(q.chave); }}
            />
            <button className="btn small secondary" onClick={() => adicionar(q.chave)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}
