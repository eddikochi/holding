import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CONFIG_LOGISTICO_ATIVOS } from '../../../db/database';
import { salvarGalpoesLogistico } from '../../../db/actions';
import { rankingDeDores, relevanciaCurtoPrazo, type RelevanciaLog } from '../../../lib/calc/logistico';
import { EmptyState } from '../../../components/EmptyState';
import { StakeholdersPanel } from '../StakeholdersPanel';
import { EvidenciasPanel } from '../EvidenciasPanel';
import type { TipoAtivo } from '../../../models/types';

const FILTROS: { v: 'todos' | RelevanciaLog; r: string }[] = [
  { v: 'todos', r: 'Todos' }, { v: 'curto', r: 'Curto prazo' }, { v: 'hub', r: 'Tese de hub' },
];
const ROTULO_TIPO: Record<TipoAtivo, string> = {
  galpao: 'Galpão', terreno: 'Terreno', loja: 'Loja', oficina: 'Oficina', outro: 'Outro',
};

/**
 * Aba "Dados" do módulo 05 Logístico. Padrão próprio (não usa TabelaAgrupadaMediana:
 * o pilar não tem métrica numérica comparável). Foco em ESTADO e honestidade do vazio:
 * distingue perfis desk (hipótese) de players entrevistados (campo), sem esconder nada.
 * O funil de validação fica na aba Discovery.
 */
export function LogisticoDados() {
  const [filtro, setFiltro] = useState<'todos' | RelevanciaLog>('todos');
  const dados = useLiveQuery(async () => {
    const [stakeholders, ativos, cfg] = await Promise.all([
      db.stakeholders.where('pilar').equals('logistico').toArray(),
      db.ativos.toArray(),
      db.config.get(CONFIG_LOGISTICO_ATIVOS),
    ]);
    const galpaoIds: string[] = Array.isArray(cfg?.valor) ? (cfg!.valor as string[]) : [];
    return { stakeholders, ativos, galpaoIds };
  });

  if (!dados) return <div className="panel">Carregando…</div>;

  const { stakeholders, ativos, galpaoIds } = dados;
  const galpoes = ativos.filter((a) => galpaoIds.includes(a.id));
  async function toggleGalpao(id: string) {
    await salvarGalpoesLogistico(galpaoIds.includes(id) ? galpaoIds.filter((x) => x !== id) : [...galpaoIds, id]);
  }
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
          <EmptyState titulo="Nenhum ativo cadastrado">
            O galpão operacional é o ativo âncora deste pilar. Cadastre-o no módulo 01 Patrimonial ou importe do campo.
          </EmptyState>
        ) : (
          <>
            {galpoes.length === 0 ? (
              <p style={{ color: 'var(--amber)', fontSize: 13, marginTop: 0 }}>
                ▲ Nenhum ativo designado como galpão operacional. Marque abaixo qual imóvel é o galpão (pode ser terreno/oficina — não depende do tipo cadastral).
              </p>
            ) : (
              galpoes.map((a) => (
                <div key={a.id} style={{ fontSize: 13, marginBottom: 8 }}>
                  <b>{a.nome}</b>
                  <span style={{ color: 'var(--ink-soft)' }}> · {ROTULO_TIPO[a.tipo]}</span>
                  {a.metragens.construidaM2 ? ` · ${a.metragens.construidaM2} m²` : a.metragens.terrenoM2 ? ` · ${a.metragens.terrenoM2} m² (terreno)` : ''}
                  <br /><span style={{ color: 'var(--ink-soft)' }}>{a.estadoFisico || 'sem descrição de estado'}</span>
                </div>
              ))
            )}
            <details style={{ marginTop: 'var(--s2)' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 12.5 }}>
                Designar galpão operacional ({galpoes.length} de {ativos.length})
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--s2)' }}>
                {ativos.map((a) => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
                    <input type="checkbox" checked={galpaoIds.includes(a.id)} onChange={() => toggleGalpao(a.id)} style={{ width: 'auto' }} />
                    {a.nome || '(sem nome)'} <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>· {ROTULO_TIPO[a.tipo]}</span>
                  </label>
                ))}
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
