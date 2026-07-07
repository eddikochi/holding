import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { salvarStakeholder, apagarStakeholder, stakeholderEmBranco } from '../../db/actions';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import type { Stakeholder, Pilar, Disposicao } from '../../models/types';

/** Lista + CRUD de stakeholders (players) de um pilar. Reutilizável entre módulos. */
export function StakeholdersPanel({ pilar, titulo, ajuda }: { pilar: Pilar; titulo: string; ajuda: string }) {
  const toast = useToast();
  const stakeholders = useLiveQuery(() => db.stakeholders.where('pilar').equals(pilar).toArray(), [pilar]);
  const [edit, setEdit] = useState<Stakeholder | null>(null);

  if (!stakeholders) return <div className="panel">Carregando…</div>;

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{titulo} ({stakeholders.length})</h2>
        <button className="btn small" onClick={() => setEdit(stakeholderEmBranco(pilar))}>+ Novo</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{ajuda}</p>
      {stakeholders.length === 0 ? (
        <EmptyState titulo="Nenhum registro ainda">Cadastre o primeiro, ou importe da ferramenta de campo.</EmptyState>
      ) : (
        <table>
          <thead><tr><th>Nome</th><th>Segmento</th><th>Dor / oportunidade</th><th>Paga?</th><th></th></tr></thead>
          <tbody>
            {stakeholders.map((s) => (
              <tr key={s.id}>
                <td><b>{s.nome}</b><br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{s.local}</span></td>
                <td>{s.segmento}</td>
                <td>{s.dorOportunidade}</td>
                <td>{s.disposicao ?? '—'}{s.valorCitado ? ` (${s.valorCitado})` : ''}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn small secondary" onClick={() => setEdit(s)}>Editar</button>
                    <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarStakeholder(s.id); toast('Apagado'); } }}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {edit && <StakeholderModal stakeholder={edit} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function StakeholderModal({ stakeholder, onFechar }: { stakeholder: Stakeholder; onFechar: () => void }) {
  const toast = useToast();
  const [s, setS] = useState<Stakeholder>(stakeholder);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!s.nome.trim()) { setErro('Preencha o nome.'); return; }
    await salvarStakeholder(s); toast('Salvo'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{stakeholder.nome ? 'Editar' : 'Novo'} registro</h3>
        <div className="form-grid">
          <div><label>Nome</label><input type="text" value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} /></div>
          <div><label>Segmento</label><input type="text" value={s.segmento} onChange={(e) => setS({ ...s, segmento: e.target.value })} /></div>
          <div><label>Contato</label><input type="text" value={s.contato} onChange={(e) => setS({ ...s, contato: e.target.value })} /></div>
          <div><label>Local</label><input type="text" value={s.local} onChange={(e) => setS({ ...s, local: e.target.value })} /></div>
        </div>
        <label>Dor / oportunidade</label>
        <textarea value={s.dorOportunidade} onChange={(e) => setS({ ...s, dorOportunidade: e.target.value })} />
        <div className="form-grid">
          <div><label>Disposição de pagamento</label>
            <select value={s.disposicao ?? ''} onChange={(e) => setS({ ...s, disposicao: (e.target.value || undefined) as Disposicao })}>
              <option value="">—</option><option value="sim">Sim</option><option value="talvez">Talvez</option><option value="nao">Não</option><option value="nao_perguntado">Não perguntado</option>
            </select>
          </div>
          <div><label>Valor citado</label><input type="text" value={s.valorCitado ?? ''} onChange={(e) => setS({ ...s, valorCitado: e.target.value })} /></div>
        </div>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
