/**
 * Painel de decisão (Fase 5, FRONTEND) — piloto: ZONA 2, mapa (a) evidência × validação.
 * Público: pai e irmão, vendo para onde ir. Só leitura, nunca formulário.
 *
 * Mostra o estado ATUAL como ele é. Se nenhuma hipótese está validada, o mapa
 * mostra evidência acumulando SEM validação — e o quadrante "validada" fica vazio.
 * Isso é o estado real (honestidade do vazio), não uma falha a esconder.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { mapaEvidenciaValidacao } from '../../lib/calc/mapaDecisao';
import { MapaEvidenciaValidacao } from './MapaEvidenciaValidacao';

export function PainelDecisao() {
  const dados = useLiveQuery(async () => {
    const [hipoteses, evidencias] = await Promise.all([
      db.hipoteses.toArray(),
      db.evidencias.toArray(),
    ]);
    return { mapa: mapaEvidenciaValidacao(hipoteses, evidencias) };
  });

  if (!dados) {
    return (
      <div>
        <PageHeader kicker="Painel de decisão" titulo="Para onde ir" />
        <div className="panel">Carregando…</div>
      </div>
    );
  }

  const { mapa } = dados;
  const { pontos, resumo } = mapa;
  const refutadas = pontos.filter((p) => p.status === 'refutada');

  return (
    <div>
      <PageHeader
        kicker="Painel de decisão · Zona 2"
        titulo="Para onde ir"
        descricao="Cada hipótese posicionada por quanta evidência a sustenta (→) e quão validada ela está (↑). A posição é a recomendação."
      />

      {resumo.totalHipoteses === 0 ? (
        <div className="panel">
          <EmptyState titulo="Ainda não há hipóteses">
            Quando você registrar hipóteses e vincular evidências nos diagnósticos, elas aparecem
            aqui posicionadas por evidência e validação.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Síntese derivada do estado atual — muda sozinha quando os dados mudam */}
          <div className="panel sintese-painel">
            <div className="sintese-frase">{resumo.sintese}</div>
          </div>

          <div className="kpi-row" style={{ marginBottom: 16 }}>
            <div className="kpi-box"><div className="n">{resumo.totalHipoteses}</div><div className="l">hipóteses</div></div>
            <div className="kpi-box"><div className="n">{resumo.comEvidencia}</div><div className="l">com sustentação</div></div>
            <div className="kpi-box"><div className="n" style={{ color: 'var(--green)' }}>{resumo.validadas}</div><div className="l">validadas</div></div>
            <div className="kpi-box"><div className="n" style={{ color: resumo.comRefuta ? 'var(--red)' : undefined }}>{resumo.comRefuta}</div><div className="l">com refuta</div></div>
          </div>

          <div className="panel">
            <h2>Evidência × validação</h2>
            <p style={{ color: 'var(--ink-soft)', marginTop: 0, fontSize: 13 }}>
              Toque numa bolha para ver a hipótese. A faixa de cima (“validada”) fica vazia
              enquanto nenhuma hipótese estiver validada — é o estado real, não um erro.
            </p>
            <MapaEvidenciaValidacao pontos={pontos} maxSustenta={resumo.maxSustenta} />
          </div>

          {/* Honestidade do vazio: dizer explicitamente o que ainda não aconteceu */}
          {resumo.validadas === 0 && resumo.comEvidencia > 0 && (
            <div className="panel vazio-honesto">
              <b>Nenhuma hipótese validada ainda.</b> A evidência está se acumulando, mas nenhuma
              aposta foi marcada como validada. O próximo gargalo é validar, não coletar mais dado.
            </div>
          )}

          {/* Refutadas ficam fora do 2×2 (desfecho terminal), mas não somem */}
          {refutadas.length > 0 && (
            <div className="panel">
              <h2 style={{ color: 'var(--red)' }}>Refutadas ({refutadas.length})</h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: 0, fontSize: 13 }}>
                Descartadas pela evidência — saem do mapa, mas ficam registradas.
              </p>
              {refutadas.map((r) => (
                <div key={r.id} className="refutada-linha">
                  <span className="rc">{r.codigo}</span> {r.enunciado || '(sem enunciado)'}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
