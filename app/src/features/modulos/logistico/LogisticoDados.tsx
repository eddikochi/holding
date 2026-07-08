import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import {
  salvarStakeholder, apagarStakeholder, stakeholderEmBranco,
  salvarEvidencia, evidenciaEmBranco, vincularEvidenciaAHipotese,
} from '../../../db/actions';
import { rankingDeDores } from '../../../lib/calc/logistico';
import { EmptyState } from '../../../components/EmptyState';
import { BadgeConfianca } from '../../../components/Badge';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import type { Hipotese, Stakeholder, Evidencia } from '../../../models/types';

/**
 * Aba "Dados" do módulo 05 Logístico. Gerencia os dados de campo do pilar:
 * players, ranking de dores, evidências e o galpão. O funil de validação
 * (hipótese → evidência → validação) fica na aba Discovery (DiscoveryPanel).
 */
export function LogisticoDados() {
  const toast = useToast();
  const dados = useLiveQuery(async () => {
    const [stakeholders, hipoteses, evidencias, ativos] = await Promise.all([
      db.stakeholders.where('pilar').equals('logistico').toArray(),
      db.hipoteses.where('pilar').equals('logistico').toArray(),
      db.evidencias.where('pilar').equals('logistico').toArray(),
      db.ativos.where('tipo').equals('galpao').toArray(),
    ]);
    return { stakeholders, hipoteses, evidencias, ativos };
  });

  const [editStk, setEditStk] = useState<Stakeholder | null>(null);
  const [editEv, setEditEv] = useState<Evidencia | null>(null);

  if (!dados) return <div className="panel">Carregando…</div>;

  const { stakeholders, hipoteses, evidencias, ativos } = dados;
  const dores = rankingDeDores(stakeholders);
  const maxDor = dores[0]?.contagem ?? 1;

  return (
    <div>
      <div className="alerta ok">
        O funil hipótese → evidência → validação deste pilar fica na aba <b>Discovery</b>.
        Aqui você gerencia os dados de campo: players, dores e evidências.
      </div>

      {/* RANKING DE DORES */}
      <div className="panel">
        <h2>Ranking de dores</h2>
        {dores.length === 0 ? (
          <EmptyState titulo="Sem dores registradas">
            As dores vêm do campo "dor/oportunidade" dos players logísticos abaixo (ou do import).
          </EmptyState>
        ) : (
          dores.map((d) => (
            <div className="rank-row" key={d.dor}>
              <div className="rl" title={d.dor}>{d.dor}</div>
              <div className="rt"><div className="rf" style={{ width: `${Math.round((d.contagem / maxDor) * 100)}%` }} /></div>
              <div className="rn">{d.contagem}</div>
            </div>
          ))
        )}
      </div>

      {/* PLAYERS LOGÍSTICOS */}
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Players logísticos ({stakeholders.length})</h2>
          <button className="btn small" onClick={() => setEditStk(stakeholderEmBranco('logistico'))}>+ Novo player</button>
        </div>
        {stakeholders.length === 0 ? (
          <EmptyState titulo="Nenhum player ainda">
            Transportadoras, despachantes, empresas locais. Cadastre aqui ou importe da ferramenta de campo.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Segmento</th><th>Dor/Oportunidade</th><th>Hipótese</th><th></th></tr></thead>
            <tbody>
              {stakeholders.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.nome}</b><br /><span style={{ color: 'var(--ink-soft)' }}>{s.local}</span></td>
                  <td>{s.segmento}</td>
                  <td>{s.dorOportunidade}</td>
                  <td style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{hipoteses.find((h) => h.id === s.hipoteseId)?.enunciado?.slice(0, 30) ?? '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEditStk(s)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm('Apagar player?')) { await apagarStakeholder(s.id); toast('Player apagado'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EVIDÊNCIAS */}
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Evidências ({evidencias.length})</h2>
          <button className="btn small" onClick={() => setEditEv(evidenciaEmBranco('logistico'))}>+ Nova evidência</button>
        </div>
        {evidencias.length === 0 ? (
          <EmptyState titulo="Nenhuma evidência ainda">
            Evidência é um fato coletado (entrevista, observação, dado). Vincule cada uma a uma
            hipótese para alimentar o funil de validação.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Conteúdo</th><th>Fonte</th><th>Confiança</th><th>Vinculada a</th><th></th></tr></thead>
            <tbody>
              {evidencias.map((e) => (
                <tr key={e.id}>
                  <td>{e.conteudo.slice(0, 80)}{e.conteudo.length > 80 ? '…' : ''}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{e.fonteDetalhe ?? e.fonte} · {fmtData(e.data)}</span></td>
                  <td style={{ fontSize: 11 }}>{e.fonte}</td>
                  <td><BadgeConfianca confianca={e.confianca} /></td>
                  <td>
                    <select
                      value={e.hipoteseId ?? ''}
                      onChange={async (ev) => { await vincularEvidenciaAHipotese(e.id, ev.target.value || undefined); toast('Vínculo atualizado'); }}
                      style={{ fontSize: 12, padding: '4px 6px' }}
                    >
                      <option value="">— sem vínculo —</option>
                      {hipoteses.map((h) => <option key={h.id} value={h.id}>{h.enunciado.slice(0, 40) || '(sem enunciado)'}</option>)}
                    </select>
                  </td>
                  <td><button className="btn small secondary" onClick={() => setEditEv(e)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* diagnóstico do galpão (atalho informativo) */}
      <div className="panel">
        <h2>Diagnóstico do galpão</h2>
        {ativos.length === 0 ? (
          <EmptyState titulo="Nenhum galpão cadastrado">
            O galpão é o ativo âncora deste pilar. Cadastre-o no módulo 01 Patrimonial ou importe do campo.
          </EmptyState>
        ) : (
          ativos.map((a) => (
            <div key={a.id} style={{ fontSize: 13, marginBottom: 8 }}>
              <b>{a.nome}</b>
              {a.metragens.construidaM2 ? ` · ${a.metragens.construidaM2} m²` : ''}
              <br /><span style={{ color: 'var(--ink-soft)' }}>{a.estadoFisico || 'sem descrição de estado'}</span>
            </div>
          ))
        )}
      </div>

      {editStk && <StakeholderModal stakeholder={editStk} onFechar={() => setEditStk(null)} />}
      {editEv && <EvidenciaModal evidencia={editEv} hipoteses={hipoteses} onFechar={() => setEditEv(null)} />}
    </div>
  );
}

/* ── modais ───────────────────────────────────────────────────────────── */

function StakeholderModal({ stakeholder, onFechar }: { stakeholder: Stakeholder; onFechar: () => void }) {
  const toast = useToast();
  const [s, setS] = useState<Stakeholder>(stakeholder);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!s.nome.trim()) { setErro('Preencha o nome.'); return; }
    await salvarStakeholder(s); toast('Player salvo'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{stakeholder.nome ? 'Editar player' : 'Novo player'}</h3>
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
            <select value={s.disposicao ?? ''} onChange={(e) => setS({ ...s, disposicao: (e.target.value || undefined) as Stakeholder['disposicao'] })}>
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

function EvidenciaModal({ evidencia, hipoteses, onFechar }: { evidencia: Evidencia; hipoteses: Hipotese[]; onFechar: () => void }) {
  const toast = useToast();
  const [e, setE] = useState<Evidencia>(evidencia);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!e.conteudo.trim()) { setErro('Escreva o conteúdo da evidência.'); return; }
    await salvarEvidencia(e); toast('Evidência salva'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(ev) => ev.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{evidencia.conteudo ? 'Editar evidência' : 'Nova evidência'}</h3>
        <label>Conteúdo</label>
        <textarea value={e.conteudo} onChange={(ev) => setE({ ...e, conteudo: ev.target.value })} />
        <div className="form-grid">
          <div><label>Fonte</label>
            <select value={e.fonte} onChange={(ev) => setE({ ...e, fonte: ev.target.value as Evidencia['fonte'] })}>
              <option value="entrevista">Entrevista</option><option value="observacao_campo">Observação de campo</option><option value="pesquisa_desk">Pesquisa desk</option><option value="dado_oficial">Dado oficial</option>
            </select>
          </div>
          <div><label>Confiança</label>
            <select value={e.confianca} onChange={(ev) => setE({ ...e, confianca: ev.target.value as Evidencia['confianca'] })}>
              <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
        <label>Vincular à hipótese</label>
        <select value={e.hipoteseId ?? ''} onChange={(ev) => setE({ ...e, hipoteseId: ev.target.value || undefined })}>
          <option value="">— sem vínculo —</option>
          {hipoteses.map((h) => <option key={h.id} value={h.id}>{h.enunciado.slice(0, 40) || '(sem enunciado)'}</option>)}
        </select>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
