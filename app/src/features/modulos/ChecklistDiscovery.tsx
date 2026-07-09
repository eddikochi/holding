import { useEffect, useState } from 'react';
import { obterChecklistDiscovery, salvarChecklistDiscovery, progressoChecklist } from '../../db/actions';
import { itensChecklistPadrao } from '../../content/onboarding';
import { novoId } from '../../lib/ids';
import type { ItemChecklistDiscovery, CategoriaDiscovery } from '../../models/types';

const CATS: { v: CategoriaDiscovery; rotulo: string; icone: string; classe: string }[] = [
  { v: 'campo', rotulo: 'Campo (presencial em São Borja)', icone: '🧭', classe: 'cd-campo' },
  { v: 'desk', rotulo: 'Desk (de Porto Alegre)', icone: '💻', classe: 'cd-desk' },
];

/**
 * Checklist de discovery unificado do pilar: uma só lista (o antigo "quais dados
 * coletar e onde" + "checklist"). Itens marcáveis (persistidos), editáveis,
 * removíveis e extensíveis via "+ Adicionar item". Progresso = % marcados.
 */
export function ChecklistDiscovery({ slug }: { slug: string }) {
  const [itens, setItens] = useState<ItemChecklistDiscovery[] | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [novoTexto, setNovoTexto] = useState('');
  const [novaCat, setNovaCat] = useState<CategoriaDiscovery>('campo');

  useEffect(() => {
    let vivo = true;
    obterChecklistDiscovery(slug, itensChecklistPadrao(slug)).then((l) => { if (vivo) setItens(l); });
    return () => { vivo = false; };
  }, [slug]);

  if (!itens) return <div className="panel">Carregando…</div>;

  function persistir(prox: ItemChecklistDiscovery[]) {
    setItens(prox);
    salvarChecklistDiscovery(slug, prox);
  }
  const toggle = (id: string) => persistir(itens!.map((i) => (i.id === id ? { ...i, feito: !i.feito } : i)));
  const remover = (id: string) => persistir(itens!.filter((i) => i.id !== id));
  function salvarEdicao(id: string) {
    const t = rascunho.trim();
    if (t) persistir(itens!.map((i) => (i.id === id ? { ...i, texto: t } : i)));
    setEditando(null);
  }
  function adicionar() {
    const t = novoTexto.trim();
    if (!t) return;
    persistir([...itens!, { id: novoId(), texto: t, categoria: novaCat, feito: false, custom: true }]);
    setNovoTexto('');
  }

  const feitos = itens.filter((i) => i.feito).length;
  const pct = progressoChecklist(itens);

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Checklist de discovery</h2>
        <span className="note">{feitos} de {itens.length} · {pct}%</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
        O que coletar e onde. Marque conforme avança — o progresso alimenta a barra deste módulo na
        visão geral. Você pode editar, remover e adicionar itens.
      </p>
      <div className="prog-track" style={{ margin: '4px 0 12px' }}><div className="prog-fill" style={{ width: `${pct}%` }} /></div>

      {CATS.map((cat) => {
        const doGrupo = itens.filter((i) => i.categoria === cat.v);
        return (
          <div key={cat.v} className={`cd-col ${cat.classe}`} style={{ marginBottom: 12 }}>
            <h4>{cat.icone} {cat.rotulo}</h4>
            {doGrupo.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>Nenhum item nesta categoria.</p>
            ) : doGrupo.map((item) => (
              <div key={item.id} className="chk-item">
                {editando === item.id ? (
                  <>
                    <input type="text" value={rascunho} onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.id); if (e.key === 'Escape') setEditando(null); }} autoFocus />
                    <button className="btn small" onClick={() => salvarEdicao(item.id)}>Salvar</button>
                    <button className="btn small ghost" onClick={() => setEditando(null)}>×</button>
                  </>
                ) : (
                  <>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, fontWeight: 400, textTransform: 'none', flex: 1, cursor: 'pointer' }}>
                      <input type="checkbox" checked={item.feito} onChange={() => toggle(item.id)} style={{ width: 'auto', marginTop: 2 }} />
                      <span style={{ textDecoration: item.feito ? 'line-through' : 'none', color: item.feito ? 'var(--ink-soft)' : 'var(--ink)' }}>
                        {item.texto}{item.custom && <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}> · seu</span>}
                      </span>
                    </label>
                    <button className="btn small ghost" title="Editar" onClick={() => { setEditando(item.id); setRascunho(item.texto); }}>✎</button>
                    <button className="btn small ghost" title="Remover" onClick={() => remover(item.id)}>🗑</button>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      })}

      <div className="chk-add">
        <input type="text" value={novoTexto} placeholder="Adicionar item de discovery…" aria-label="Novo item"
          onChange={(e) => setNovoTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') adicionar(); }} />
        <select value={novaCat} onChange={(e) => setNovaCat(e.target.value as CategoriaDiscovery)} aria-label="Categoria" style={{ width: 'auto' }}>
          <option value="campo">Campo</option>
          <option value="desk">Desk</option>
        </select>
        <button className="btn small" onClick={adicionar}>+ Adicionar item</button>
      </div>
    </div>
  );
}
