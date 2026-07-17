import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import {
  obterPapeis, salvarPapeis, obterRitos, salvarRitos, obterModeloDecisorio, salvarModeloDecisorio,
  salvarDecisao, apagarDecisao, decisaoEmBranco,
  salvarKPI, apagarKPI, kpiEmBranco, registrarMedicao,
} from '../../../db/actions';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { CampoNumero } from '../../../components/CampoNumero';
import { BadgeDecisao } from '../../../components/Badge';
import { Sparkline } from '../../../components/Sparkline';
import { Tabs } from '../../../components/Tabs';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import { novoId } from '../../../lib/ids';
import type { PapelFamiliar, Rito, Decisao, KPI, Hipotese, Evidencia } from '../../../models/types';

/** Módulo 12 — Governança Familiar: papéis, modelo, ritos, Decision Log, KPIs. */
export function GovernancaView() {
  return (
    <div>
      <PageHeader
        kicker="Módulo 12"
        titulo="Governança Familiar"
        descricao="Quem decide o quê, como as decisões ficam registradas e como o projeto é acompanhado."
      />
      <Tabs
        abas={[
          { id: 'papeis', rotulo: 'Papéis e ritos', conteudo: <PapeisRitos /> },
          { id: 'decisoes', rotulo: 'Decision Log', conteudo: <DecisionLog /> },
          { id: 'kpis', rotulo: 'KPIs', conteudo: <KPIsSection /> },
        ]}
      />
    </div>
  );
}

/* ── Papéis, modelo decisório e ritos ─────────────────────────────────── */
function PapeisRitos() {
  const toast = useToast();
  const [papeis, setPapeis] = useState<PapelFamiliar[]>([]);
  const [ritos, setRitos] = useState<Rito[]>([]);
  const [modelo, setModelo] = useState('');

  useEffect(() => {
    obterPapeis().then(setPapeis);
    obterRitos().then(setRitos);
    obterModeloDecisorio().then(setModelo);
  }, []);

  async function addPapel() { const p = [...papeis, { id: novoId(), nome: '', papel: '', responsabilidades: '' }]; setPapeis(p); await salvarPapeis(p); }
  async function updPapel(id: string, patch: Partial<PapelFamiliar>) { const p = papeis.map((x) => x.id === id ? { ...x, ...patch } : x); setPapeis(p); await salvarPapeis(p); }
  async function delPapel(id: string) { const p = papeis.filter((x) => x.id !== id); setPapeis(p); await salvarPapeis(p); }
  async function addRito() { const r = [...ritos, { id: novoId(), nome: '', frequencia: '', pauta: '' }]; setRitos(r); await salvarRitos(r); }
  async function updRito(id: string, patch: Partial<Rito>) { const r = ritos.map((x) => x.id === id ? { ...x, ...patch } : x); setRitos(r); await salvarRitos(r); }
  async function delRito(id: string) { const r = ritos.filter((x) => x.id !== id); setRitos(r); await salvarRitos(r); }

  return (
    <div>
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Papéis familiares</h2>
          <button className="btn small" onClick={addPapel}>+ Papel</button>
        </div>
        {papeis.length === 0 ? (
          <EmptyState titulo="Nenhum papel definido">Quem faz o quê na gestão do patrimônio. Ex.: Fulano — decisões operacionais.</EmptyState>
        ) : papeis.map((p) => (
          <div key={p.id} className="form-grid" style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, alignItems: 'end' }}>
            <div><label>Nome</label><input type="text" value={p.nome} onChange={(e) => updPapel(p.id, { nome: e.target.value })} /></div>
            <div><label>Papel</label><input type="text" value={p.papel} onChange={(e) => updPapel(p.id, { papel: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Responsabilidades</label><input type="text" value={p.responsabilidades} onChange={(e) => updPapel(p.id, { responsabilidades: e.target.value })} /></div>
            <div><button className="btn small danger" onClick={() => { if (confirm('Remover papel?')) delPapel(p.id); }}>Remover</button></div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Modelo decisório</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>O que cada nível pode decidir sozinho, e o que exige consenso. Escreva em texto claro.</p>
        <textarea value={modelo} onChange={(e) => setModelo(e.target.value)} onBlur={async () => { await salvarModeloDecisorio(modelo); toast('Modelo salvo'); }} style={{ minHeight: 120 }}
          placeholder="Ex.: gastos até R$ X: decisão individual. Acima: consenso dos irmãos. Venda de ativo: todos." />
      </div>

      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Ritos (reuniões)</h2>
          <button className="btn small" onClick={addRito}>+ Rito</button>
        </div>
        {ritos.length === 0 ? (
          <EmptyState titulo="Nenhum rito definido">Reuniões periódicas mantêm o projeto vivo. Ex.: reunião trimestral, pauta padrão.</EmptyState>
        ) : ritos.map((r) => (
          <div key={r.id} className="form-grid" style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, alignItems: 'end' }}>
            <div><label>Nome</label><input type="text" value={r.nome} onChange={(e) => updRito(r.id, { nome: e.target.value })} /></div>
            <div><label>Frequência</label><input type="text" value={r.frequencia} onChange={(e) => updRito(r.id, { frequencia: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Pauta padrão</label><input type="text" value={r.pauta} onChange={(e) => updRito(r.id, { pauta: e.target.value })} /></div>
            <div><button className="btn small danger" onClick={() => { if (confirm('Remover rito?')) delRito(r.id); }}>Remover</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Decision Log ─────────────────────────────────────────────────────── */
function DecisionLog() {
  const toast = useToast();
  const dados = useLiveQuery(async () => ({
    decisoes: await db.decisoes.toArray(),
    hipoteses: await db.hipoteses.toArray(),
    evidencias: await db.evidencias.toArray(),
  }));
  const [edit, setEdit] = useState<Decisao | null>(null);
  const [filtro, setFiltro] = useState('');

  if (!dados) return <div className="panel">Carregando…</div>;
  const { decisoes, hipoteses, evidencias } = dados;
  const lista = decisoes
    .filter((d) => !filtro || (d.decisao + d.contexto + d.motivo + d.quemDecidiu).toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Decision Log ({decisoes.length})</h2>
        <button className="btn small" onClick={() => setEdit(decisaoEmBranco())}>+ Registrar decisão</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>Toda decisão importante fica aqui — com o porquê e as evidências/hipóteses que a embasaram.</p>
      {decisoes.length > 0 && <input type="text" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ marginBottom: 12 }} />}

      {decisoes.length === 0 ? (
        <EmptyState titulo="Nenhuma decisão registrada">Registre decisões à medida que as toma. Isso evita refazer discussões e mostra por que cada caminho foi escolhido.</EmptyState>
      ) : (
        <table>
          <thead><tr><th>Data</th><th>Decisão</th><th>Quem</th><th>Reversível</th><th>Embasada em</th><th></th></tr></thead>
          <tbody>
            {lista.map((d) => (
              <tr key={d.id}>
                <td>{fmtData(d.data)}</td>
                <td><BadgeDecisao /> <b>{d.decisao || '(sem título)'}</b><br /><span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{d.motivo}</span></td>
                <td>{d.quemDecidiu}</td>
                <td>{d.reversivel ? 'Sim' : 'Não'}</td>
                <td style={{ fontSize: 11 }}>{d.hipoteseIds.length} hip. · {d.evidenciaIds.length} evid.</td>
                <td>
                  <div className="row-actions">
                    <button className="btn small secondary" onClick={() => setEdit(d)}>Editar</button>
                    <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarDecisao(d.id); toast('Apagada'); } }}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {edit && <DecisaoModal decisao={edit} hipoteses={hipoteses} evidencias={evidencias} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function DecisaoModal({ decisao, hipoteses, evidencias, onFechar }: { decisao: Decisao; hipoteses: Hipotese[]; evidencias: Evidencia[]; onFechar: () => void }) {
  const toast = useToast();
  const [d, setD] = useState<Decisao>(decisao);
  const [erro, setErro] = useState<string | null>(null);
  function toggle(campo: 'hipoteseIds' | 'evidenciaIds', id: string) {
    setD({ ...d, [campo]: d[campo].includes(id) ? d[campo].filter((x) => x !== id) : [...d[campo], id] });
  }
  async function salvar() {
    if (!d.decisao.trim()) { setErro('Escreva a decisão.'); return; }
    await salvarDecisao(d); toast('Decisão registrada'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{decisao.decisao ? 'Editar decisão' : 'Registrar decisão'}</h3>
        <label>Decisão</label><input type="text" value={d.decisao} onChange={(e) => setD({ ...d, decisao: e.target.value })} />
        <label>Contexto</label><textarea value={d.contexto} onChange={(e) => setD({ ...d, contexto: e.target.value })} />
        <label>Motivo</label><textarea value={d.motivo} onChange={(e) => setD({ ...d, motivo: e.target.value })} />
        <div className="form-grid">
          <div><label>Quem decidiu</label><input type="text" value={d.quemDecidiu} onChange={(e) => setD({ ...d, quemDecidiu: e.target.value })} /></div>
          <div><label>Data</label><input type="date" value={d.data.slice(0, 10)} onChange={(e) => setD({ ...d, data: e.target.value ? new Date(e.target.value).toISOString() : d.data })} /></div>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none' }}>
          <input type="checkbox" checked={d.reversivel} onChange={(e) => setD({ ...d, reversivel: e.target.checked })} style={{ width: 'auto' }} /> Reversível
        </label>
        {hipoteses.length > 0 && (
          <><label>Hipóteses que embasaram</label>
            <div style={{ maxHeight: 90, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 7, padding: 8 }}>
              {hipoteses.map((h) => (
                <label key={h.id} style={{ display: 'flex', gap: 8, fontWeight: 400, textTransform: 'none', margin: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={d.hipoteseIds.includes(h.id)} onChange={() => toggle('hipoteseIds', h.id)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: 12 }}>{h.enunciado.slice(0, 50)}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {evidencias.length > 0 && (
          <><label>Evidências que embasaram</label>
            <div style={{ maxHeight: 90, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 7, padding: 8 }}>
              {evidencias.map((ev) => (
                <label key={ev.id} style={{ display: 'flex', gap: 8, fontWeight: 400, textTransform: 'none', margin: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={d.evidenciaIds.includes(ev.id)} onChange={() => toggle('evidenciaIds', ev.id)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: 12 }}>{ev.conteudo.slice(0, 50)}</span>
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

/* ── KPIs ─────────────────────────────────────────────────────────────── */
function KPIsSection() {
  const toast = useToast();
  const kpis = useLiveQuery(() => db.kpis.toArray());
  const [edit, setEdit] = useState<KPI | null>(null);
  const [medindo, setMedindo] = useState<KPI | null>(null);

  if (!kpis) return <div className="panel">Carregando…</div>;

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>KPIs do projeto ({kpis.length})</h2>
        <button className="btn small" onClick={() => setEdit(kpiEmBranco())}>+ Novo KPI</button>
      </div>
      {kpis.length === 0 ? (
        <EmptyState titulo="Nenhum KPI ainda">Indicadores para acompanhar o projeto. Ex.: nº de entrevistas, ocupação do galpão, receita mensal.</EmptyState>
      ) : (
        <table>
          <thead><tr><th>Indicador</th><th>Atual</th><th>Alvo</th><th>Evolução</th><th></th></tr></thead>
          <tbody>
            {kpis.map((k) => {
              const atual = k.historico.length ? k.historico[k.historico.length - 1].valor : null;
              return (
                <tr key={k.id}>
                  <td><b>{k.nome || '(sem nome)'}</b> <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{k.unidade}</span></td>
                  <td>{atual == null ? '—' : atual.toLocaleString('pt-BR')}</td>
                  <td>{k.valorAlvo == null ? '—' : k.valorAlvo.toLocaleString('pt-BR')}</td>
                  <td><Sparkline valores={k.historico.map((m) => m.valor)} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small" onClick={() => setMedindo(k)}>+ Medição</button>
                      <button className="btn small secondary" onClick={() => setEdit(k)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarKPI(k.id); toast('Apagado'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {edit && <KPIModal kpi={edit} onFechar={() => setEdit(null)} />}
      {medindo && <MedicaoModal kpi={medindo} onFechar={() => setMedindo(null)} />}
    </div>
  );
}

function KPIModal({ kpi, onFechar }: { kpi: KPI; onFechar: () => void }) {
  const toast = useToast();
  const [k, setK] = useState<KPI>(kpi);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!k.nome.trim()) { setErro('Dê um nome ao KPI.'); return; }
    await salvarKPI(k); toast('KPI salvo'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{kpi.nome ? 'Editar KPI' : 'Novo KPI'}</h3>
        <label>Nome</label><input type="text" value={k.nome} onChange={(e) => setK({ ...k, nome: e.target.value })} />
        <div className="form-grid">
          <div><label>Unidade</label><input type="text" value={k.unidade} onChange={(e) => setK({ ...k, unidade: e.target.value })} placeholder="ex.: R$, %, un." /></div>
          <div><label>Valor alvo</label><CampoNumero value={k.valorAlvo} vazio={null} onChange={(v) => setK({ ...k, valorAlvo: v })} /></div>
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

function MedicaoModal({ kpi, onFechar }: { kpi: KPI; onFechar: () => void }) {
  const toast = useToast();
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v)) { setErro('Digite um número.'); return; }
    await registrarMedicao(kpi.id, { data: new Date(data).toISOString(), valor: v });
    toast('Medição registrada'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Nova medição — {kpi.nome}</h3>
        <div className="form-grid">
          <div><label>Valor ({kpi.unidade})</label><input type="text" value={valor} onChange={(e) => setValor(e.target.value)} autoFocus /></div>
          <div><label>Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        </div>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Registrar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
