import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/database';
import { MODULOS } from '../../modulos';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { contarPorPilar, progressoModulo } from '../../lib/calc/progresso';

/** Home / Visão Geral: progresso dos 12 módulos, alertas e acessos rápidos. */
export function Home() {
  const dados = useLiveQuery(async () => {
    const [ativos, stakeholders, evidencias, hipoteses] = await Promise.all([
      db.ativos.toArray(),
      db.stakeholders.toArray(),
      db.evidencias.toArray(),
      db.hipoteses.toArray(),
    ]);
    return { ativos, stakeholders, evidencias, hipoteses };
  });

  if (!dados) {
    return (
      <div>
        <PageHeader kicker="Visão geral" titulo="Masterplan São Borja" />
        <div className="panel">Carregando…</div>
      </div>
    );
  }

  const totalDados =
    dados.ativos.length + dados.stakeholders.length + dados.evidencias.length + dados.hipoteses.length;
  const porPilar = contarPorPilar(dados.stakeholders, dados.evidencias, dados.hipoteses);

  const alertas: string[] = [];
  if (dados.ativos.length === 0) alertas.push('Nenhum ativo cadastrado ainda — comece pelo Diagnóstico Patrimonial ou importe seus dados de campo.');
  for (const m of MODULOS) {
    if (m.pilar) {
      const c = { ...porPilar[m.pilar], ativos: m.pilar === 'patrimonial' ? dados.ativos.length : 0 };
      const semDados = c.stakeholders + c.evidencias + c.hipoteses + c.ativos === 0;
      if (semDados) alertas.push(`Pilar ${m.nome.replace('Diagnóstico ', '')} ainda sem dados.`);
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Visão geral"
        titulo="Masterplan São Borja"
        descricao="Transformar os ativos da família em oportunidades de negócio, validando hipóteses antes de investir."
        acoes={
          <>
            <Link className="btn" to="/importar">Importar dados de campo</Link>
            <Link className="btn secondary" to="/backup">Backup</Link>
          </>
        }
      />

      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <div className="kpi-box"><div className="n">{dados.ativos.length}</div><div className="l">ativos</div></div>
        <div className="kpi-box"><div className="n">{dados.stakeholders.length}</div><div className="l">stakeholders</div></div>
        <div className="kpi-box"><div className="n">{dados.evidencias.length}</div><div className="l">evidências</div></div>
        <div className="kpi-box"><div className="n">{dados.hipoteses.length}</div><div className="l">hipóteses</div></div>
      </div>

      {totalDados === 0 && (
        <div className="panel">
          <EmptyState
            titulo="Comece por aqui"
            acao={<Link className="btn" to="/importar">Importar dados de campo</Link>}
          >
            Você ainda não tem dados no app. Se já usou a ferramenta de campo (offline), exporte o
            JSON dela e importe aqui — ativos, stakeholders e registros entram sem perda. Os dados
            ficam guardados no navegador (IndexedDB) e persistem quando você fechar e reabrir.
          </EmptyState>
        </div>
      )}

      <div className="panel">
        <h2>Alertas</h2>
        {alertas.length === 0 ? (
          <div className="alerta ok">Sem alertas pendentes. Bom trabalho.</div>
        ) : (
          alertas.slice(0, 6).map((a, i) => <div className="alerta" key={i}>{a}</div>)
        )}
      </div>

      <div className="panel">
        <h2>Progresso dos 12 módulos</h2>
        <div className="grid-modulos" style={{ marginTop: 12 }}>
          {MODULOS.map((m) => {
            const c = m.pilar
              ? { ...porPilar[m.pilar], ativos: m.pilar === 'patrimonial' ? dados.ativos.length : porPilar[m.pilar].ativos }
              : { ativos: 0, stakeholders: 0, evidencias: 0, hipoteses: 0 };
            const pct = m.pilar ? progressoModulo(c) : 0;
            return (
              <Link className="modulo-card" to={`/modulo/${m.slug}`} key={m.slug}>
                <div className="mnum">MÓDULO {m.num}</div>
                <div className="mnome">{m.nome.replace('Diagnóstico ', '')}</div>
                <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {m.pilar ? `${pct}% preenchido` : 'Fase posterior'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
