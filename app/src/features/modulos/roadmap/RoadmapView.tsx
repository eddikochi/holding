import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarTarefa, apagarTarefa, tarefaEmBranco } from '../../../db/actions';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import { PILARES } from '../../../models/types';
import type { Tarefa, Horizonte, StatusTarefa, Pilar } from '../../../models/types';

const HORIZONTES: { v: Horizonte; r: string }[] = [
  { v: 'h0_12m', r: '0–12 meses' },
  { v: 'h1_3a', r: '1–3 anos' },
  { v: 'h3_5a', r: '3–5 anos' },
  { v: 'h5_10a', r: '5–10 anos' },
];
const STATUS: { v: StatusTarefa; r: string; cls: string }[] = [
  { v: 'a_fazer', r: 'A fazer', cls: 'st-nao_validada' },
  { v: 'em_andamento', r: 'Em andamento', cls: 'st-parcial' },
  { v: 'concluida', r: 'Concluída', cls: 'st-validada' },
  { v: 'bloqueada', r: 'Bloqueada', cls: 'st-refutada' },
];

/** Módulo 11 — roadmap em colunas por horizonte, com dependências visíveis. */
export function RoadmapView() {
  const toast = useToast();
  const dados = useLiveQuery(async () => ({
    tarefas: await db.tarefas.toArray(),
    businessCases: await db.businessCases.toArray(),
  }));
  const [edit, setEdit] = useState<Tarefa | null>(null);

  if (!dados) return <div className="panel">Carregando…</div>;
  const { tarefas, businessCases } = dados;

  function nomeTarefa(id: string) { return tarefas.find((t) => t.id === id)?.titulo ?? '(removida)'; }

  return (
    <div>
      <PageHeader
        kicker="Módulo 11"
        titulo="Roadmap de Implantação"
        descricao="Quando cada coisa acontece. Tarefas e marcos por horizonte de tempo, com as dependências à mostra."
        acoes={<button className="btn" onClick={() => setEdit(tarefaEmBranco())}>+ Nova tarefa/marco</button>}
      />

      {tarefas.length === 0 ? (
        <div className="panel">
          <EmptyState titulo="Nenhuma tarefa ainda">
            Transforme os business cases aprovados em passos com prazo. Cada tarefa entra num horizonte
            (0–12 meses, 1–3, 3–5, 5–10 anos) e pode depender de outra.
          </EmptyState>
        </div>
      ) : (
        <div className="roadmap-cols">
          {HORIZONTES.map((h) => {
            const doHorizonte = tarefas.filter((t) => t.horizonte === h.v);
            return (
              <div key={h.v} className="roadmap-col">
                <div className="roadmap-col-head">{h.r} <span>({doHorizonte.length})</span></div>
                {doHorizonte.length === 0 ? (
                  <div className="mq-vazio">nada aqui</div>
                ) : doHorizonte.map((t) => {
                  const st = STATUS.find((s) => s.v === t.status)!;
                  return (
                    <div key={t.id} className="roadmap-card" onClick={() => setEdit(t)}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.titulo || '(sem título)'}</div>
                      <div style={{ margin: '4px 0' }}><span className={`badge ${st.cls}`}>{st.r}</span></div>
                      {t.responsavel && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>👤 {t.responsavel}</div>}
                      {t.pilar && <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{PILARES.find((p) => p.chave === t.pilar)?.rotulo}</div>}
                      {t.dependenciasIds.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4 }}>
                          bloqueado por: {t.dependenciasIds.map(nomeTarefa).join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {edit && <TarefaModal tarefa={edit} todas={tarefas} businessCases={businessCases} onFechar={() => setEdit(null)} onApagar={async () => { await apagarTarefa(edit.id); toast('Apagada'); setEdit(null); }} />}
    </div>
  );
}

function TarefaModal({ tarefa, todas, businessCases, onFechar, onApagar }: {
  tarefa: Tarefa; todas: Tarefa[]; businessCases: { id: string; nome: string }[]; onFechar: () => void; onApagar: () => void;
}) {
  const toast = useToast();
  const [t, setT] = useState<Tarefa>(tarefa);
  const [erro, setErro] = useState<string | null>(null);
  const outras = todas.filter((x) => x.id !== t.id);

  function toggleDep(id: string) {
    setT({ ...t, dependenciasIds: t.dependenciasIds.includes(id) ? t.dependenciasIds.filter((d) => d !== id) : [...t.dependenciasIds, id] });
  }
  async function salvar() {
    if (!t.titulo.trim()) { setErro('Dê um título.'); return; }
    await salvarTarefa(t); toast('Salva'); onFechar();
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{tarefa.titulo ? 'Editar tarefa/marco' : 'Nova tarefa/marco'}</h3>
        <label>Título</label><input type="text" value={t.titulo} onChange={(e) => setT({ ...t, titulo: e.target.value })} />
        <div className="form-grid">
          <div><label>Horizonte</label>
            <select value={t.horizonte} onChange={(e) => setT({ ...t, horizonte: e.target.value as Horizonte })}>
              {HORIZONTES.map((h) => <option key={h.v} value={h.v}>{h.r}</option>)}
            </select>
          </div>
          <div><label>Status</label>
            <select value={t.status} onChange={(e) => setT({ ...t, status: e.target.value as StatusTarefa })}>
              {STATUS.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
            </select>
          </div>
          <div><label>Responsável</label><input type="text" value={t.responsavel} onChange={(e) => setT({ ...t, responsavel: e.target.value })} /></div>
          <div><label>Pilar</label>
            <select value={t.pilar ?? ''} onChange={(e) => setT({ ...t, pilar: (e.target.value || undefined) as Pilar })}>
              <option value="">—</option>
              {PILARES.map((p) => <option key={p.chave} value={p.chave}>{p.rotulo}</option>)}
            </select>
          </div>
        </div>
        {businessCases.length > 0 && (
          <>
            <label>Business case relacionado</label>
            <select value={t.businessCaseId ?? ''} onChange={(e) => setT({ ...t, businessCaseId: e.target.value || undefined })}>
              <option value="">—</option>
              {businessCases.map((bc) => <option key={bc.id} value={bc.id}>{bc.nome}</option>)}
            </select>
          </>
        )}
        {outras.length > 0 && (
          <>
            <label>Bloqueado por (dependências)</label>
            <div style={{ maxHeight: 110, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 7, padding: 8 }}>
              {outras.map((o) => (
                <label key={o.id} style={{ display: 'flex', gap: 8, fontWeight: 400, textTransform: 'none', margin: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={t.dependenciasIds.includes(o.id)} onChange={() => toggleDep(o.id)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: 12 }}>{o.titulo || '(sem título)'}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
          {tarefa.titulo && <button className="btn danger" onClick={onApagar}>Apagar</button>}
        </div>
      </div>
    </div>
  );
}
