import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AnalisePilar, Pilar } from '../../models/types';
import { obterOuCriarAnalise, salvarAnalise } from '../../db/actions';
import { db } from '../../db/database';
import { funilDoPilar } from '../../lib/calc/discovery';
import { SwotEditor } from '../../components/SwotEditor';
import { useToast } from '../../components/Toast';

/** Aba "Análise" compartilhada por todos os diagnósticos: SWOT + leitura executiva. */
export function AnaliseTab({ pilar }: { pilar: Pilar }) {
  const toast = useToast();
  const [analise, setAnalise] = useState<AnalisePilar | null>(null);
  const funil = useLiveQuery(async () => {
    const [hip, ev] = await Promise.all([
      db.hipoteses.where('pilares').equals(pilar).toArray(),
      db.evidencias.where('pilares').equals(pilar).toArray(),
    ]);
    return funilDoPilar(hip, ev);
  }, [pilar]);

  useEffect(() => {
    let vivo = true;
    obterOuCriarAnalise(pilar).then((a) => { if (vivo) setAnalise(a); });
    return () => { vivo = false; };
  }, [pilar]);

  if (!analise) return <div className="panel">Carregando…</div>;

  async function salvar(prox: AnalisePilar) {
    setAnalise(prox);
    await salvarAnalise(prox);
  }

  return (
    <div>
      {funil && funil.total > 0 && (
        <div className="panel">
          <h2>Resumo do funil</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Como as hipóteses deste pilar estão, para ancorar a leitura executiva.</p>
          <div className="funil">
            <div className="funil-etapa"><div className="n">{funil.total}</div><div className="l">hipóteses</div></div>
            <div className="funil-seta">·</div>
            <div className="funil-etapa"><div className="n" style={{ color: 'var(--green)' }}>{funil.validada}</div><div className="l">validadas</div></div>
            <div className="funil-seta">·</div>
            <div className="funil-etapa"><div className="n" style={{ color: 'var(--red)' }}>{funil.refutada}</div><div className="l">refutadas</div></div>
            <div className="funil-seta">·</div>
            <div className="funil-etapa"><div className="n">{funil.comEvidencia}</div><div className="l">com sustentação</div></div>
          </div>
          {funil.comRefuta > 0 && (
            <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              ▲ {funil.comRefuta} hipótese(s) com evidência que refuta.
            </p>
          )}
        </div>
      )}
      <div className="panel">
        <h2>SWOT do pilar</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          Monte a leitura estratégica em 4 quadrantes. Arraste um item entre quadrantes para
          reclassificá-lo. Salva automaticamente.
        </p>
        <SwotEditor valor={analise.swot} onChange={(swot) => salvar({ ...analise, swot })} />
      </div>

      <div className="panel">
        <h2>Leitura executiva</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          Suas conclusões deste diagnóstico, em texto corrido. O que os dados dizem?
        </p>
        <textarea
          value={analise.leituraExecutiva}
          onChange={(e) => setAnalise({ ...analise, leituraExecutiva: e.target.value })}
          onBlur={() => { salvarAnalise(analise); toast('Análise salva'); }}
          style={{ minHeight: 120 }}
        />
        <label>Recomendações</label>
        <textarea
          value={analise.recomendacoes}
          onChange={(e) => setAnalise({ ...analise, recomendacoes: e.target.value })}
          onBlur={() => { salvarAnalise(analise); toast('Análise salva'); }}
          style={{ minHeight: 90 }}
        />
      </div>
    </div>
  );
}
