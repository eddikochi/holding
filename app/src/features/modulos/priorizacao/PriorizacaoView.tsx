import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../../db/database';
import {
  salvarOportunidade, promoverOportunidadeParaBC,
  obterPesos, salvarPesos, PESOS_PADRAO, type PesosPriorizacao,
} from '../../../db/actions';
import { rankearOportunidades, quadranteDe, type QuadranteMatriz } from '../../../lib/calc/priorizacao';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import type { Oportunidade } from '../../../models/types';

const QUADRANTES: { chave: QuadranteMatriz; rotulo: string; sub: string; x: number; y: number; cor: string }[] = [
  { chave: 'quick_wins', rotulo: 'Quick wins', sub: 'alto impacto · baixo esforço', x: 0.75, y: 0.25, cor: 'var(--green)' },
  { chave: 'apostas_grandes', rotulo: 'Apostas grandes', sub: 'alto impacto · alto esforço', x: 0.75, y: 0.75, cor: 'var(--blue)' },
  { chave: 'preencher_tempo', rotulo: 'Preencher tempo', sub: 'baixo impacto · baixo esforço', x: 0.25, y: 0.25, cor: 'var(--amber)' },
  { chave: 'descartar', rotulo: 'Descartar', sub: 'baixo impacto · alto esforço', x: 0.25, y: 0.75, cor: 'var(--red)' },
];

/** Módulo 09 — matriz Impacto × Esforço (drag) + ranking por score composto. */
export function PriorizacaoView() {
  const toast = useToast();
  const oportunidades = useLiveQuery(() => db.oportunidades.toArray());
  const [pesos, setPesos] = useState<PesosPriorizacao>(PESOS_PADRAO);

  useEffect(() => { obterPesos().then(setPesos); }, []);

  if (!oportunidades) return <div className="panel">Carregando…</div>;

  const ativas = oportunidades.filter((o) => o.status !== 'descartada');
  const ranking = rankearOportunidades(ativas, pesos);

  async function soltarNoQuadrante(op: Oportunidade, q: typeof QUADRANTES[number]) {
    await salvarOportunidade({ ...op, posicaoMatriz: { x: q.x, y: q.y } });
  }
  async function mudarPeso(campo: keyof PesosPriorizacao, v: string) {
    const n = parseFloat(v);
    const prox = { ...pesos, [campo]: isNaN(n) ? 0 : n };
    setPesos(prox);
    await salvarPesos(prox);
  }

  return (
    <div>
      <PageHeader
        kicker="Módulo 09"
        titulo="Priorização"
        descricao="Por onde começar. Posicione as oportunidades na matriz e veja o ranking por impacto, investimento e risco — com critério transparente."
      />

      {ativas.length === 0 ? (
        <div className="panel">
          <EmptyState titulo="Nenhuma oportunidade para priorizar" acao={<Link className="btn" to="/modulo/oportunidades">Ir para Oportunidades</Link>}>
            Cadastre oportunidades no módulo 08 (e dê notas de impacto/esforço) para posicioná-las aqui.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Matriz Impacto × Esforço</h2>
            <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Arraste cada oportunidade para o quadrante certo. A posição é salva.</p>
            <div className="matriz-quad-grid">
              {QUADRANTES.map((q) => (
                <div key={q.chave} className="matriz-quad" style={{ borderTopColor: q.cor }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('opId');
                    const op = ativas.find((o) => o.id === id);
                    if (op) soltarNoQuadrante(op, q);
                  }}>
                  <div className="mq-head" style={{ color: q.cor }}>{q.rotulo}<span>{q.sub}</span></div>
                  {ativas.filter((o) => quadranteDe(o) === q.chave).map((o) => (
                    <div key={o.id} className="mq-card" draggable onDragStart={(e) => e.dataTransfer.setData('opId', o.id)}>
                      {o.nome || '(sem nome)'}
                    </div>
                  ))}
                  {ativas.filter((o) => quadranteDe(o) === q.chave).length === 0 && <div className="mq-vazio">solte aqui</div>}
                </div>
              ))}
            </div>
            {ativas.some((o) => quadranteDe(o) === null) && (
              <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>
                {ativas.filter((o) => quadranteDe(o) === null).length} oportunidade(s) sem impacto/esforço definido não aparecem na matriz — defina as notas no módulo 08.
              </p>
            )}
          </div>

          <div className="panel">
            <h2>Ranking (impacto × investimento × risco)</h2>
            <div className="row-actions" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Pesos:</span>
              {(['impacto', 'investimento', 'risco'] as const).map((c) => (
                <label key={c} style={{ margin: 0, display: 'flex', gap: 4, alignItems: 'center', textTransform: 'capitalize' }}>
                  {c}
                  <input type="number" step="0.5" min="0" value={pesos[c]} onChange={(e) => mudarPeso(c, e.target.value)} style={{ width: 64 }} />
                </label>
              ))}
            </div>
            <table>
              <thead><tr><th>#</th><th>Oportunidade</th><th>Impacto</th><th>Invest.</th><th>Risco</th><th>Score</th><th></th></tr></thead>
              <tbody>
                {ranking.map(({ oportunidade: o, score }, i) => (
                  <tr key={o.id}>
                    <td><b>{i + 1}</b></td>
                    <td><b>{o.nome || '(sem nome)'}</b></td>
                    <td>{o.impacto ?? '—'}</td>
                    <td>{o.investimento ?? '—'}</td>
                    <td>{o.risco ?? '—'}</td>
                    <td><b>{score == null ? '—' : score.toFixed(1)}</b></td>
                    <td>
                      <button className="btn small secondary" onClick={async () => { await promoverOportunidadeParaBC(o.id); toast('Promovida a business case'); }}>Promover a BC →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
