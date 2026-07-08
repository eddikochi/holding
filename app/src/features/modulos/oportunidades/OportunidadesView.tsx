import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../../db/database';
import {
  salvarOportunidade, apagarOportunidade, oportunidadeEmBranco,
  promoverHipoteseParaOportunidade,
} from '../../../db/actions';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { BadgeStatusHipotese } from '../../../components/Badge';
import { useToast } from '../../../components/Toast';
import { PILARES } from '../../../models/types';
import type { Oportunidade, Pilar, Nota1a5, StatusOportunidade, Hipotese } from '../../../models/types';

const STATUS: { v: StatusOportunidade; r: string }[] = [
  { v: 'ideia', r: 'Ideia' }, { v: 'em_avaliacao', r: 'Em avaliação' },
  { v: 'promovida', r: 'Promovida' }, { v: 'descartada', r: 'Descartada' },
];
const NOTAS: Nota1a5[] = [1, 2, 3, 4, 5];

/** Módulo 08 — lista mestre de oportunidades. */
export function OportunidadesView() {
  const toast = useToast();
  const dados = useLiveQuery(async () => ({
    oportunidades: await db.oportunidades.toArray(),
    hipoteses: await db.hipoteses.toArray(),
  }));
  const [edit, setEdit] = useState<Oportunidade | null>(null);
  const [filtroPilar, setFiltroPilar] = useState<Pilar | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusOportunidade | ''>('');

  if (!dados) return <div className="panel">Carregando…</div>;
  const { oportunidades, hipoteses } = dados;
  const validadas = hipoteses.filter((h) => h.status === 'validada');

  const lista = oportunidades.filter((o) =>
    (!filtroPilar || o.pilares.includes(filtroPilar)) &&
    (!filtroStatus || o.status === filtroStatus)
  );

  return (
    <div>
      <PageHeader
        kicker="Módulo 08"
        titulo="Oportunidades de Negócio"
        descricao="Onde o diagnóstico vira candidato a decisão. Crie oportunidades à mão ou promova a partir de hipóteses validadas — nada entra por palpite."
        acoes={<button className="btn" onClick={() => setEdit(oportunidadeEmBranco())}>+ Nova oportunidade</button>}
      />

      {validadas.length > 0 && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Promover hipótese validada</h3>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0, fontSize: 13 }}>Estas hipóteses já têm evidência suficiente. Vire oportunidade com um clique.</p>
          {validadas.map((h: Hipotese) => (
            <div key={h.id} className="row-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8 }}>
              <span style={{ fontSize: 13 }}><BadgeStatusHipotese status={h.status} /> {h.enunciado}</span>
              <button className="btn small secondary" onClick={async () => { await promoverHipoteseParaOportunidade(h.id); toast('Oportunidade criada'); }}>Promover →</button>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="row-actions" style={{ marginBottom: 12 }}>
          <select value={filtroPilar} onChange={(e) => setFiltroPilar(e.target.value as Pilar | '')} style={{ width: 'auto' }}>
            <option value="">Todos os pilares</option>
            {PILARES.map((p) => <option key={p.chave} value={p.chave}>{p.rotulo}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusOportunidade | '')} style={{ width: 'auto' }}>
            <option value="">Todos os status</option>
            {STATUS.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
          </select>
          <span className="note">{lista.length} de {oportunidades.length}</span>
        </div>

        {oportunidades.length === 0 ? (
          <EmptyState titulo="Nenhuma oportunidade ainda" acao={<Link className="btn secondary" to="/modulo/logistico">Ver hipóteses do Hub</Link>}>
            As oportunidades nascem do cruzamento dos diagnósticos. Crie uma à mão ou valide uma
            hipótese (≥ 3 evidências) e promova-a aqui.
          </EmptyState>
        ) : lista.length === 0 ? (
          <div className="empty-state"><p>Nenhuma oportunidade com esses filtros.</p></div>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Pilares</th><th>Impacto</th><th>Invest.</th><th>Risco</th><th>Esforço</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {lista.map((o) => (
                <tr key={o.id}>
                  <td><b>{o.nome || '(sem nome)'}</b><br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{o.hipoteseIds.length} hipótese(s)</span></td>
                  <td style={{ fontSize: 11 }}>{o.pilares.map((p) => PILARES.find((x) => x.chave === p)?.rotulo).join(', ') || '—'}</td>
                  <td>{o.impacto ?? '—'}</td>
                  <td>{o.investimento ?? '—'}</td>
                  <td>{o.risco ?? '—'}</td>
                  <td>{o.esforco ?? '—'}</td>
                  <td style={{ fontSize: 11 }}>{STATUS.find((s) => s.v === o.status)?.r}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEdit(o)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarOportunidade(o.id); toast('Apagada'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edit && <OportunidadeModal oportunidade={edit} hipoteses={hipoteses} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function OportunidadeModal({ oportunidade, hipoteses, onFechar }: { oportunidade: Oportunidade; hipoteses: Hipotese[]; onFechar: () => void }) {
  const toast = useToast();
  const [o, setO] = useState<Oportunidade>(oportunidade);
  const [erro, setErro] = useState<string | null>(null);

  function togglePilar(p: Pilar) {
    setO({ ...o, pilares: o.pilares.includes(p) ? o.pilares.filter((x) => x !== p) : [...o.pilares, p] });
  }
  function toggleHip(id: string) {
    setO({ ...o, hipoteseIds: o.hipoteseIds.includes(id) ? o.hipoteseIds.filter((x) => x !== id) : [...o.hipoteseIds, id] });
  }
  function setNota(campo: 'impacto' | 'investimento' | 'risco' | 'esforco', v: string) {
    setO({ ...o, [campo]: v === '' ? undefined : (Number(v) as Nota1a5) });
  }
  async function salvar() {
    if (!o.nome.trim()) { setErro('Dê um nome à oportunidade.'); return; }
    await salvarOportunidade(o); toast('Oportunidade salva'); onFechar();
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{oportunidade.nome ? 'Editar oportunidade' : 'Nova oportunidade'}</h3>
        <label>Nome</label><input type="text" value={o.nome} onChange={(e) => setO({ ...o, nome: e.target.value })} />
        <label>Descrição</label><textarea value={o.descricao} onChange={(e) => setO({ ...o, descricao: e.target.value })} />

        <label>Pilares</label>
        <div className="row-actions">
          {PILARES.map((p) => (
            <button key={p.chave} type="button" className={'btn small ' + (o.pilares.includes(p.chave) ? '' : 'ghost')} onClick={() => togglePilar(p.chave)}>{p.rotulo}</button>
          ))}
        </div>

        <div className="form-grid" style={{ marginTop: 12 }}>
          {(['impacto', 'investimento', 'risco', 'esforco'] as const).map((campo) => (
            <div key={campo}>
              <label style={{ textTransform: 'capitalize' }}>{campo} (1–5)</label>
              <select value={o[campo] ?? ''} onChange={(e) => setNota(campo, e.target.value)}>
                <option value="">—</option>
                {NOTAS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
        </div>

        <label>Status</label>
        <select value={o.status} onChange={(e) => setO({ ...o, status: e.target.value as StatusOportunidade })}>
          {STATUS.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
        </select>

        {hipoteses.length > 0 && (
          <>
            <label>Hipóteses ligadas</label>
            <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 7, padding: 8 }}>
              {hipoteses.map((h) => (
                <label key={h.id} style={{ display: 'flex', gap: 8, fontWeight: 400, textTransform: 'none', margin: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={o.hipoteseIds.includes(h.id)} onChange={() => toggleHip(h.id)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: 12 }}>{h.enunciado.slice(0, 60)}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
