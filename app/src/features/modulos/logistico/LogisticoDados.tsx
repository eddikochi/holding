import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { rankingDeDores, relevanciaCurtoPrazo, type RelevanciaLog } from '../../../lib/calc/logistico';
import { EmptyState } from '../../../components/EmptyState';
import { StakeholdersPanel } from '../StakeholdersPanel';
import { EvidenciasPanel } from '../EvidenciasPanel';

const FILTROS: { v: 'todos' | RelevanciaLog; r: string }[] = [
  { v: 'todos', r: 'Todos' }, { v: 'curto', r: 'Curto prazo' }, { v: 'hub', r: 'Tese de hub' },
];

/**
 * Aba "Dados" do módulo 05 Logístico. Padrão próprio (não usa TabelaAgrupadaMediana:
 * o pilar não tem métrica numérica comparável). Foco em ESTADO e honestidade do vazio:
 * distingue perfis desk (hipótese) de players entrevistados (campo), sem esconder nada.
 * O funil de validação fica na aba Discovery.
 */
export function LogisticoDados() {
  const [filtro, setFiltro] = useState<'todos' | RelevanciaLog>('todos');
  const dados = useLiveQuery(async () => {
    const [stakeholders, ativos] = await Promise.all([
      db.stakeholders.where('pilar').equals('logistico').toArray(),
      db.ativos.where('tipo').equals('galpao').toArray(),
    ]);
    return { stakeholders, ativos };
  });

  if (!dados) return <div className="panel">Carregando…</div>;

  const { stakeholders, ativos } = dados;
  // Estado do pilar (derivado): desk = disposição não perguntada; entrevistado = qualquer outra.
  const entrevistados = stakeholders.filter((s) => s.disposicao && s.disposicao !== 'nao_perguntado').length;
  const desk = stakeholders.length - entrevistados;

  const dores = rankingDeDores(stakeholders);
  const maxDor = dores[0]?.contagem ?? 0;
  const modoLista = maxDor <= 1; // toda contagem = 1 → placeholders desk, sem barra comparativa

  const filtrar = filtro === 'todos' ? undefined : (s: { dorOportunidade?: string; segmento?: string }) => relevanciaCurtoPrazo(s) === filtro;

  return (
    <div>
      {stakeholders.length > 0 && (
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: `3px solid ${entrevistados === 0 ? 'var(--amber)' : 'var(--green)'}` }}>
          <span aria-hidden style={{ color: entrevistados === 0 ? 'var(--amber)' : 'var(--green)' }}>{entrevistados === 0 ? '▲' : '✓'}</span>
          <span style={{ fontSize: 13 }}>
            <b>{desk}</b> perf{desk === 1 ? 'il' : 'is'} desk · <b>{entrevistados}</b> player{entrevistados === 1 ? '' : 's'} entrevistado{entrevistados === 1 ? '' : 's'}
            {entrevistados === 0 ? ' — pilar aguardando campo' : ''}
          </span>
        </div>
      )}

      <div className="alerta ok">
        O funil hipótese → evidência → validação deste pilar fica na aba <b>Discovery</b>.
        Aqui você gerencia os dados de campo: players, dores e evidências.
      </div>

      <StakeholdersPanel
        pilar="logistico"
        titulo="Players logísticos"
        ajuda="Perfis desk (hipóteses de segmento) e players reais. Os perfis desk são o roteiro: direcionam quem procurar em campo."
        estadoDesk
        filtrar={filtrar}
        controle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '0 0 var(--s3)' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Relevância para a jogada:</span>
            {FILTROS.map((f) => (
              <button key={f.v} className={`btn small ${filtro === f.v ? '' : 'ghost'}`} onClick={() => setFiltro(f.v)}>{f.r}</button>
            ))}
          </div>
        }
      />

      <div className="panel">
        <h2>{modoLista ? 'Dores mapeadas (desk) — a validar em campo' : 'Ranking de dores'}</h2>
        {dores.length === 0 ? (
          <EmptyState titulo="Sem dores registradas">
            As dores vêm do campo "dor/oportunidade" dos players (ou do import).
          </EmptyState>
        ) : modoLista ? (
          <div>
            <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 0 }}>
              Cada dor veio de um perfil desk (contagem 1). A barra de ranking volta quando uma dor for citada por mais de um player.
            </p>
            {dores.map((d) => (
              <div key={d.dor} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                {d.dor}
                {d.segmentos.length > 0 && <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}> · {d.segmentos.join(', ')}</span>}
              </div>
            ))}
          </div>
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

      <EvidenciasPanel
        pilar="logistico"
        titulo="Evidências"
        ajuda="Fatos coletados no campo (entrevistas, observações, documentos). Vincule cada uma a uma hipótese para alimentar o funil da aba Discovery."
      />

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
    </div>
  );
}
