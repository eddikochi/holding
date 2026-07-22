import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMinEvidencias } from '../../db/database';
import {
  salvarHipotese, apagarHipotese, hipoteseEmBranco, vincularEvidenciaAHipotese, RegraDominioError,
} from '../../db/actions';
import { funilDoPilar, evidenciasDaHipotese, contarEfeitos, efeitoDe } from '../../lib/calc/discovery';
import { DISCOVERY_PILAR } from '../../content/discovery';
import { EmptyState } from '../../components/EmptyState';
import { BadgeStatusHipotese, PontoConfianca } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { fmtData } from '../../lib/datas';
import { compararCodigo } from '../../lib/ordenar';
import { vinculosDe } from '../../models/types';
import type { Pilar, Hipotese, StatusHipotese, EfeitoVinculo } from '../../models/types';

const ROTULO_EFEITO: Record<EfeitoVinculo, string> = { sustenta: 'sustenta', refuta: 'refuta', neutro: 'neutro' };

/**
 * Painel de Discovery de um pilar: funil hipótese → evidência → validação → decisão.
 * Reutilizado por todos os diagnósticos (01–07). Expande cada hipótese para ver
 * TODAS as evidências e entrevistas vinculadas.
 */
export function DiscoveryPanel({ pilar }: { pilar: Pilar }) {
  const toast = useToast();
  const [min, setMin] = useState(3);
  const [aberta, setAberta] = useState<string | null>(null);
  const [nova, setNova] = useState<Hipotese | null>(null);

  useEffect(() => { getMinEvidencias().then(setMin); }, []);

  const dados = useLiveQuery(async () => {
    const [hipoteses, evidencias, stakeholders, decisoes] = await Promise.all([
      db.hipoteses.where('pilares').equals(pilar).toArray(),
      db.evidencias.where('pilares').equals(pilar).toArray(),
      db.stakeholders.where('pilar').equals(pilar).toArray(),
      db.decisoes.toArray(),
    ]);
    return { hipoteses, evidencias, stakeholders, decisoes };
  }, [pilar]);

  if (!dados) return <div className="panel">Carregando…</div>;
  const { hipoteses, evidencias, stakeholders, decisoes } = dados;
  const funil = funilDoPilar(hipoteses, evidencias);

  async function validar(h: Hipotese) {
    try { await salvarHipotese({ ...h, status: 'validada' }); toast('Hipótese validada'); }
    catch (e) { toast(e instanceof RegraDominioError ? e.message : 'Erro'); }
  }
  async function mudarStatus(h: Hipotese, status: StatusHipotese) {
    try { await salvarHipotese({ ...h, status }); toast('Status atualizado'); }
    catch (e) { toast(e instanceof RegraDominioError ? e.message : 'Erro'); }
  }

  return (
    <div>
      <div className="panel">
        <h2>Funil de validação</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          O caminho de cada tese: hipótese → evidências que a sustentam → validação → decisão.
          Uma hipótese só é "validada" com pelo menos {min} evidências vinculadas.
        </p>
        <div className="funil">
          <div className="funil-etapa"><div className="n">{funil.total}</div><div className="l">hipóteses</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n">{funil.comEvidencia}</div><div className="l">com sustentação</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n">{funil.parcial}</div><div className="l">parciais</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n" style={{ color: 'var(--green)' }}>{funil.validada}</div><div className="l">validadas</div></div>
          <div className="funil-seta">→</div>
          <div className="funil-etapa"><div className="n" style={{ color: 'var(--red)' }}>{funil.refutada}</div><div className="l">refutadas</div></div>
        </div>
        {funil.comRefuta > 0 && (
          <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            ▲ {funil.comRefuta} hipótese(s) com evidência que <b>refuta</b> — revisar antes de decidir.
          </p>
        )}
      </div>

      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Hipóteses do pilar</h2>
          <button className="btn small" onClick={() => setNova(hipoteseEmBranco(pilar))}>+ Nova hipótese</button>
        </div>

        {hipoteses.length === 0 ? (
          <EmptyState
            titulo="Nenhuma hipótese ainda"
            acao={DISCOVERY_PILAR[pilar]?.hipotesesIniciais ? (
              <button className="btn secondary" onClick={async () => {
                for (const enun of DISCOVERY_PILAR[pilar].hipotesesIniciais!) {
                  const nh = hipoteseEmBranco(pilar); nh.enunciado = enun;
                  await salvarHipotese(nh);
                }
                toast('Hipóteses iniciais adicionadas');
              }}>+ Adicionar hipóteses iniciais sugeridas</button>
            ) : undefined}
          >
            Uma hipótese é uma aposta a testar. Cadastre as do pilar (no Logístico, elas vêm do import
            da ferramenta de campo) e vá acumulando evidências até validar ou refutar.
          </EmptyState>
        ) : [...hipoteses].sort((a, b) => compararCodigo(a.codigo, b.codigo)).map((h) => {
          const evs = evidenciasDaHipotese(h.id, evidencias);
          const efc = contarEfeitos(h.id, evidencias);
          const entrevistados = stakeholders.filter((s) => s.hipoteseId === h.id);
          const decisao = decisoes.find((d) => d.hipoteseIds.includes(h.id));
          const atinge = efc.sustenta >= min;
          const expandida = aberta === h.id;
          return (
            <div key={h.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10 }}>
              <div className="row-actions" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setAberta(expandida ? null : h.id)}>
                <div>
                  <span style={{ marginRight: 6 }}>{expandida ? '▾' : '▸'}</span>
                  {h.codigo && <span style={{ fontWeight: 700, color: 'var(--ink-soft)', fontSize: 12, marginRight: 6 }}>{h.codigo}</span>}
                  <b>{h.enunciado || '(sem enunciado)'}</b>{' '}
                  <BadgeStatusHipotese status={h.status} />
                </div>
                <span style={{ fontSize: 12, color: atinge ? 'var(--green)' : 'var(--amber)' }}>
                  {efc.sustenta}/{min} sustentam
                  {efc.refuta > 0 && <span style={{ color: 'var(--red)' }}> · {efc.refuta} refutam</span>}
                  {decisao ? ' · decisão registrada' : ''}
                </span>
              </div>

              {expandida && (
                <div style={{ padding: '8px 0 8px 20px' }}>
                  {h.criteriosValidacao && <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}><b>Critérios:</b> {h.criteriosValidacao}</p>}

                  <h4 style={{ margin: '8px 0 4px' }}>Evidências vinculadas ({evs.length})</h4>
                  {evs.length === 0 ? <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Nenhuma. Vincule evidências abaixo.</p> : (
                    <table><tbody>
                      {evs.map((e) => {
                        const ef = efeitoDe(e, h.id);
                        return (
                          <tr key={e.id}>
                            <td style={{ fontSize: 12 }}>
                              {e.codigo && <b style={{ color: 'var(--ink-soft)', marginRight: 4 }}>{e.codigo}</b>}
                              {e.conteudo.slice(0, 90)}<br /><span style={{ color: 'var(--ink-soft)' }}>{e.fonteDetalhe ?? e.fonte} · {fmtData(e.data)}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}><PontoConfianca confianca={e.confianca} /></td>
                            <td>{ef && <span className={`efeito-${ef}`} style={{ fontSize: 11, fontWeight: 700 }}>{ROTULO_EFEITO[ef]}</span>}</td>
                            <td><button className="btn small ghost" onClick={() => vincularEvidenciaAHipotese(e.id, undefined)}>desvincular</button></td>
                          </tr>
                        );
                      })}
                    </tbody></table>
                  )}

                  {entrevistados.length > 0 && (
                    <>
                      <h4 style={{ margin: '10px 0 4px' }}>Entrevistas (contatos ligados) ({entrevistados.length})</h4>
                      <table><thead><tr><th>Nome</th><th>Data</th><th>Dor citada</th><th>Disposição</th></tr></thead>
                        <tbody>
                          {entrevistados.map((s) => (
                            <tr key={s.id}>
                              <td><b>{s.nome}</b><br /><span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{s.segmento}</span></td>
                              <td style={{ fontSize: 12 }}>{fmtData(s.data)}</td>
                              <td style={{ fontSize: 12 }}>{s.dorOportunidade || '—'}</td>
                              <td style={{ fontSize: 12 }}>{s.disposicao ?? '—'}{s.valorCitado ? ` (${s.valorCitado})` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  <VincularEvidencia hipoteseId={h.id} evidenciasLivres={evidencias.filter((e) => !vinculosDe(e).some((v) => v.hipoteseId === h.id))} />

                  {decisao && (
                    <p style={{ fontSize: 12, marginTop: 8 }}><b>Decisão associada:</b> {decisao.decisao} <span style={{ color: 'var(--ink-soft)' }}>({fmtData(decisao.data)})</span></p>
                  )}

                  <div className="row-actions" style={{ marginTop: 10 }}>
                    <button
                      className="btn small"
                      disabled={!atinge || h.status === 'validada'}
                      title={!atinge ? `Precisa de pelo menos ${min} evidências vinculadas para validar (tem ${evs.length}).` : ''}
                      onClick={() => validar(h)}
                    >Marcar validada</button>
                    <button className="btn small secondary" onClick={() => mudarStatus(h, 'parcial')}>Parcial</button>
                    <button className="btn small secondary" onClick={() => mudarStatus(h, 'refutada')}>Refutar</button>
                    <button className="btn small ghost" onClick={() => mudarStatus(h, 'nao_validada')}>Reabrir</button>
                    <button className="btn small danger" onClick={async () => { if (confirm('Apagar hipótese?')) { await apagarHipotese(h.id); toast('Apagada'); } }}>Apagar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nova && <HipoteseModal hipotese={nova} onFechar={() => setNova(null)} />}
    </div>
  );
}

function VincularEvidencia({ hipoteseId, evidenciasLivres }: { hipoteseId: string; evidenciasLivres: { id: string; conteudo: string }[] }) {
  const toast = useToast();
  const [sel, setSel] = useState('');
  if (evidenciasLivres.length === 0) return null;
  return (
    <div className="row-actions" style={{ marginTop: 8 }}>
      <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ width: 'auto', fontSize: 12 }}>
        <option value="">Vincular evidência existente…</option>
        {evidenciasLivres.map((e) => <option key={e.id} value={e.id}>{e.conteudo.slice(0, 50)}</option>)}
      </select>
      <button className="btn small secondary" disabled={!sel} onClick={async () => { await vincularEvidenciaAHipotese(sel, hipoteseId); setSel(''); toast('Evidência vinculada'); }}>Vincular</button>
    </div>
  );
}

function HipoteseModal({ hipotese, onFechar }: { hipotese: Hipotese; onFechar: () => void }) {
  const toast = useToast();
  const [h, setH] = useState<Hipotese>(hipotese);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!h.enunciado.trim()) { setErro('Escreva o enunciado.'); return; }
    try { await salvarHipotese(h); toast('Hipótese criada'); onFechar(); }
    catch (e) { setErro(e instanceof RegraDominioError ? e.message : 'Erro ao salvar.'); }
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Nova hipótese</h3>
        <label>Enunciado</label>
        <textarea value={h.enunciado} onChange={(e) => setH({ ...h, enunciado: e.target.value })} />
        <label>Critérios de validação</label>
        <textarea value={h.criteriosValidacao} onChange={(e) => setH({ ...h, criteriosValidacao: e.target.value })} />
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
