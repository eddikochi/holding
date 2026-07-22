import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/database';
import { MODULOS } from '../../modulos';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { contarPorPilar, sinaisDadosDiagnostico, progressoDiagnostico, unidadePreenchida } from '../../lib/calc/progresso';
import { progressoChecklist } from '../../db/actions';
import { linhasSemFonte } from '../../lib/calc/financeiro';
import { vinculosDe } from '../../models/types';
import type { ItemChecklistDiscovery, SazonalidadeMes } from '../../models/types';

interface Alerta { tipo: string; texto: string; }

/** Home / Visão Geral: progresso dos 12 módulos, alertas automáticos e acessos rápidos. */
export function Home() {
  const dados = useLiveQuery(async () => {
    const [ativos, stakeholders, evidencias, hipoteses, oportunidades, businessCases, tarefas, decisoes, kpis] = await Promise.all([
      db.ativos.toArray(),
      db.stakeholders.toArray(),
      db.evidencias.toArray(),
      db.hipoteses.toArray(),
      db.oportunidades.toArray(),
      db.businessCases.toArray(),
      db.tarefas.count(),
      db.decisoes.count(),
      db.kpis.count(),
    ]);
    const config = await db.config.toArray();
    const comparaveis = await db.comparaveis.count();
    return { ativos, stakeholders, evidencias, hipoteses, oportunidades, businessCases, tarefas, decisoes, kpis, config, comparaveis };
  });

  if (!dados) {
    return (
      <div>
        <PageHeader kicker="Visão geral" titulo="Masterplan São Borja" />
        <div className="panel">Carregando…</div>
      </div>
    );
  }

  const totalDados = dados.ativos.length + dados.stakeholders.length + dados.evidencias.length + dados.hipoteses.length;
  const porPilar = contarPorPilar(dados.stakeholders, dados.evidencias, dados.hipoteses);

  // ── 4 tipos de alerta automático ─────────────────────────────────────
  const alertas: Alerta[] = [];

  // 1) pilar sem dados
  for (const m of MODULOS) {
    if (!m.pilar) continue;
    const c = { ...porPilar[m.pilar], ativos: m.pilar === 'patrimonial' ? dados.ativos.length : 0 };
    if (c.stakeholders + c.evidencias + c.hipoteses + c.ativos === 0) {
      alertas.push({ tipo: 'Pilar sem dados', texto: `${m.nome.replace('Diagnóstico ', '')} ainda não tem nenhum dado.` });
    }
  }
  // 2) hipótese sem evidência
  const comEv = new Set(dados.evidencias.flatMap((e) => vinculosDe(e).map((v) => v.hipoteseId)));
  const hipsSemEv = dados.hipoteses.filter((h) => !comEv.has(h.id)).length;
  if (hipsSemEv > 0) alertas.push({ tipo: 'Hipótese sem evidência', texto: `${hipsSemEv} hipótese(s) ainda sem nenhuma evidência vinculada.` });
  // 3) pendência jurídica
  const pendJur = dados.ativos.reduce((s, a) => s + (a.checklistJuridico ?? []).filter((i) => i.status === 'pendencia').length, 0);
  if (pendJur > 0) alertas.push({ tipo: 'Pendência jurídica', texto: `${pendJur} item(ns) jurídico(s) marcado(s) como pendência.` });
  // 4) número sem fonte em business case
  const bcSemFonte = dados.businessCases.filter((bc) => linhasSemFonte(bc.capex) + linhasSemFonte(bc.opex) + linhasSemFonte(bc.receitas) > 0).length;
  if (bcSemFonte > 0) alertas.push({ tipo: 'Número sem fonte', texto: `${bcSemFonte} business case(s) com número sem fonte/premissa.` });

  // ── progresso por módulo ──────────────────────────────────────────────
  // Diagnósticos (01–08): média 50/50 de (dados do módulo) + (checklist marcado).
  // Decisão/execução (09–13): presença dos dados-chave. Ver docs/PROGRESSO.md.
  const sazCfg = dados.config.find((c) => c.chave === 'sazonalidade_agro');
  const sazonalidadeAtiva = Array.isArray(sazCfg?.valor)
    && (sazCfg!.valor as SazonalidadeMes[]).some((m) => m.intensidade && m.intensidade !== 'nenhuma');
  const subdivididos = dados.ativos.filter((a) => a.ehSubdividido);
  const subdivididosPendentes = subdivididos.filter(
    (a) => !(a.unidades?.length) || a.unidades.some((u) => !unidadePreenchida(u))
  ).length;
  const resumo = {
    ativos: dados.ativos.length,
    ativosComJuridico: dados.ativos.filter((a) => (a.checklistJuridico ?? []).some((i) => i.status !== 'nao_iniciado')).length,
    ativosComCenario: dados.ativos.filter((a) => a.cenariosUso && Object.values(a.cenariosUso).some((c) => c.pros || c.contras)).length,
    comparaveis: dados.comparaveis,
    sazonalidadeAtiva,
    subdivididos: subdivididos.length,
    subdivididosPendentes,
    porPilar,
  };
  function checklistPctDe(slug: string): number {
    const cfg = dados!.config.find((c) => c.chave === 'discovery_checklist_v2_' + slug);
    return Array.isArray(cfg?.valor) ? progressoChecklist(cfg!.valor as ItemChecklistDiscovery[]) : 0;
  }
  function progresso(slug: string, pilar?: string): number {
    if (pilar) {
      return progressoDiagnostico(sinaisDadosDiagnostico(slug, resumo), checklistPctDe(slug));
    }
    const mapa: Record<string, boolean[]> = {
      oportunidades: [dados!.oportunidades.length > 0],
      priorizacao: [dados!.oportunidades.some((o) => o.impacto != null && o.esforco != null)],
      'business-cases': [dados!.businessCases.length > 0],
      roadmap: [dados!.tarefas > 0],
      governanca: [dados!.decisoes > 0, dados!.kpis > 0],
    };
    const sinais = mapa[slug] ?? [false];
    return Math.round((sinais.filter(Boolean).length / sinais.length) * 100);
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
          <EmptyState titulo="Comece por aqui" acao={<Link className="btn" to="/importar">Importar dados de campo</Link>}>
            Você ainda não tem dados no app. Se já usou a ferramenta de campo (offline), exporte o
            JSON dela e importe aqui — ativos, stakeholders e registros entram sem perda. Os dados
            ficam guardados no navegador (IndexedDB) e persistem quando você fechar e reabrir.
          </EmptyState>
        </div>
      )}

      <div className="panel">
        <h2>Alertas automáticos</h2>
        {alertas.length === 0 ? (
          <div className="alerta ok">Sem alertas pendentes. Bom trabalho.</div>
        ) : (
          alertas.map((a, i) => (
            <div className="alerta" key={i}><b>{a.tipo}:</b> {a.texto}</div>
          ))
        )}
      </div>

      <div className="panel">
        <h2>Progresso dos 13 módulos</h2>
        <div className="grid-modulos" style={{ marginTop: 12 }}>
          {MODULOS.map((m) => {
            const pct = progresso(m.slug, m.pilar);
            return (
              <Link className="modulo-card" to={`/modulo/${m.slug}`} key={m.slug}>
                <div className="mnum">MÓDULO {m.num}</div>
                <div className="mnome">{m.nome.replace('Diagnóstico ', '')}</div>
                <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>{pct}% preenchido</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
