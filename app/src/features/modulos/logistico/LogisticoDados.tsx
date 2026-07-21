import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { rankingDeDores } from '../../../lib/calc/logistico';
import { EmptyState } from '../../../components/EmptyState';
import { StakeholdersPanel } from '../StakeholdersPanel';
import { EvidenciasPanel } from '../EvidenciasPanel';

/**
 * Aba "Dados" do módulo 05 Logístico. Gerencia os dados de campo do pilar:
 * players (com roteiro de entrevista), ranking de dores, evidências e o galpão.
 * O funil de validação fica na aba Discovery.
 *
 * As evidências usam o painel único `EvidenciasPanel` (mesmo componente dos demais
 * pilares); o vínculo evidência→hipótese continua no próprio painel.
 */
export function LogisticoDados() {
  const dados = useLiveQuery(async () => {
    const [stakeholders, ativos] = await Promise.all([
      db.stakeholders.where('pilar').equals('logistico').toArray(),
      db.ativos.where('tipo').equals('galpao').toArray(),
    ]);
    return { stakeholders, ativos };
  });

  if (!dados) return <div className="panel">Carregando…</div>;

  const { stakeholders, ativos } = dados;
  const dores = rankingDeDores(stakeholders);
  const maxDor = dores[0]?.contagem ?? 1;

  return (
    <div>
      <div className="alerta ok">
        O funil hipótese → evidência → validação deste pilar fica na aba <b>Discovery</b>.
        Aqui você gerencia os dados de campo: players, dores e evidências.
      </div>

      <StakeholdersPanel
        pilar="logistico"
        titulo="Players logísticos"
        ajuda="Transportadoras, despachantes, empresas locais. Ao cadastrar, use o roteiro de entrevista do pilar."
      />

      <div className="panel">
        <h2>Ranking de dores</h2>
        {dores.length === 0 ? (
          <EmptyState titulo="Sem dores registradas">
            As dores vêm do campo "dor/oportunidade" dos players (ou do import).
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
