import { useEffect, useState } from 'react';
import type { AnalisePilar, Pilar } from '../../models/types';
import { obterOuCriarAnalise, salvarAnalise } from '../../db/actions';
import { SwotEditor } from '../../components/SwotEditor';
import { useToast } from '../../components/Toast';

/** Aba "Análise" compartilhada por todos os diagnósticos: SWOT + leitura executiva. */
export function AnaliseTab({ pilar }: { pilar: Pilar }) {
  const toast = useToast();
  const [analise, setAnalise] = useState<AnalisePilar | null>(null);

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
