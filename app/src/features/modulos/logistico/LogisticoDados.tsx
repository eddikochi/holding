import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_MIN_EVIDENCIAS } from '../../../db/database';
import {
  salvarStakeholder, apagarStakeholder, stakeholderEmBranco,
  salvarHipotese, apagarHipotese, hipoteseEmBranco, RegraDominioError,
  salvarEvidencia, evidenciaEmBranco, vincularEvidenciaAHipotese,
} from '../../../db/actions';
import { rankingDeDores, hipotesesComContagem, etapasDoFunil } from '../../../lib/calc/logistico';
import { EmptyState } from '../../../components/EmptyState';
import { BadgeStatusHipotese, BadgeConfianca } from '../../../components/Badge';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import type { Hipotese, Stakeholder, Evidencia, StatusHipotese } from '../../../models/types';

/**
 * Aba "Dados" do módulo 05 Logístico — o pilar mais maduro.
 * Mostra o funil hipótese → evidência → validação → business case,
 * players logísticos, ranking de dores e as hipóteses do Hub com status.
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

  const [editHip, setEditHip] = useState<Hipotese | null>(null);
  const [editStk, setEditStk] = useState<Stakeholder | null>(null);
  const [editEv, setEditEv] = useState<Evidencia | null>(null);

  if (!dados) return <div className="panel">Carregando…</div>;

  const { stakeholders, hipoteses, evidencias, ativos } = dados;
  const dores = rankingDeDores(stakeholders);
  const maxDor = dores[0]?.contagem ?? 1;
  const hipContagem = hipotesesComContagem(hipoteses, evidencias, DEFAULT_MIN_EVIDENCIAS);
  const funil = etapasDoFunil(hipoteses, evidencias, 0);

  const semNada = stakeholders.length + hipoteses.length + evidencias.length === 0;

  return (
    <div>
      {/* FUNIL — critério de pronto da Fase 2 */}
      <div className="panel">
        <h2>Funil de validação do Hub</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          O caminho de uma tese até virar decisão: hipótese → evidências que a sustentam →
          validação → business case. Uma hipótese só é "validada" com pelo menos {DEFAULT_MIN_EVIDENCIAS} evidências vinculadas.
        </p>
        <div className="funil">
          <div className="funil-etapa"><div className="n">{funil.hipoteses}</div><div className="l">hipóteses</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n">{funil.evidenciasVinculadas}</div><div className="l">evidências vinculadas</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n">{funil.hipotesesValidadas}</div><div className="l">hipóteses validadas</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n">{funil.businessCases}</div><div className="l">business cases (Fase 4)</div></div>
        </div>
        {semNada && (
          <div style={{ marginTop: 12 }}>
            <EmptyState titulo="O funil se preenche com seus dados">
              Cadastre as hipóteses do Hub abaixo, registre players e evidências (ou importe do campo)
              e vincule cada evidência à hipótese que ela sustenta. O funil acima reflete isso em tempo real.
            </EmptyState>
          </div>
        )}
      </div>

      {/* HIPÓTESES DO HUB */}
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Hipóteses do Hub</h2>
          <button className="btn small" onClick={() => setEditHip(hipoteseEmBranco('logistico'))}>+ Nova hipótese</button>
        </div>
        {hipoteses.length === 0 ? (
          <EmptyState titulo="Nenhuma hipótese ainda">
            Uma hipótese é uma aposta a testar — ex.: "há demanda por armazenagem flexível".
            Cadastre as do Hub para começar a acumular evidências.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Enunciado</th><th>Status</th><th>Evidências</th><th></th></tr></thead>
            <tbody>
              {hipContagem.map(({ hipotese: h, evidenciasVinculadas, atingeMinimo }) => (
                <tr key={h.id}>
                  <td><b>{h.enunciado || '(sem enunciado)'}</b></td>
                  <td><BadgeStatusHipotese status={h.status} /></td>
                  <td>
                    {evidenciasVinculadas}
                    {!atingeMinimo && h.status !== 'refutada' && (
                      <span style={{ color: 'var(--amber)', fontSize: 11 }}> (faltam {Math.max(0, DEFAULT_MIN_EVIDENCIAS - evidenciasVinculadas)} p/ validar)</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEditHip(h)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm('Apagar hipótese? Evidências vinculadas serão desvinculadas.')) { await apagarHipotese(h.id); toast('Hipótese apagada'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

      {editHip && <HipoteseModal hipotese={editHip} onFechar={() => setEditHip(null)} />}
      {editStk && <StakeholderModal stakeholder={editStk} onFechar={() => setEditStk(null)} />}
      {editEv && <EvidenciaModal evidencia={editEv} hipoteses={hipoteses} onFechar={() => setEditEv(null)} />}
    </div>
  );
}

/* ── modais ───────────────────────────────────────────────────────────── */
function HipoteseModal({ hipotese, onFechar }: { hipotese: Hipotese; onFechar: () => void }) {
  const toast = useToast();
  const [h, setH] = useState<Hipotese>(hipotese);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!h.enunciado.trim()) { setErro('Escreva o enunciado da hipótese.'); return; }
    try { await salvarHipotese(h); toast('Hipótese salva'); onFechar(); }
    catch (e) { setErro(e instanceof RegraDominioError ? e.message : 'Erro ao salvar.'); }
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{hipotese.enunciado ? 'Editar hipótese' : 'Nova hipótese'}</h3>
        <label>Enunciado</label>
        <textarea value={h.enunciado} onChange={(e) => setH({ ...h, enunciado: e.target.value })} />
        <label>Critérios de validação</label>
        <textarea value={h.criteriosValidacao} onChange={(e) => setH({ ...h, criteriosValidacao: e.target.value })} />
        <label>Status</label>
        <select value={h.status} onChange={(e) => setH({ ...h, status: e.target.value as StatusHipotese })}>
          <option value="nao_validada">Não validada</option>
          <option value="parcial">Parcial</option>
          <option value="validada">Validada</option>
          <option value="refutada">Refutada</option>
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
