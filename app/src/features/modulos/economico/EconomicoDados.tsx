import { EvidenciasPanel } from '../EvidenciasPanel';

/**
 * Aba "Dados" do módulo 04 Econômico. Natureza qualitativa (sem métrica numérica):
 * reúsa o EvidenciasPanel com um resumo de honestidade no topo (quantos têm fonte
 * firme vs. a confirmar) e a lista agrupada por CATEGORIA de fonte (`fonteDetalhe`).
 * Regra do módulo: nunca inventar número — sem fonte é especulação, não dado.
 */
export function EconomicoDados() {
  return (
    <div>
      <div className="alerta">
        Regra deste módulo: <b>nunca invente número</b>. Todo dado entra com a fonte de onde veio
        (IBGE, prefeitura, notícia, etc.) e a data. O que não tem fonte firme fica marcado como
        "a confirmar / especulação" — inclusive as expectativas sobre o corredor bioceânico.
      </div>

      <EvidenciasPanel
        pilar="economico"
        titulo="Dados econômicos, incentivos e corredor bioceânico"
        ajuda="Demografia, economia da região, incentivos municipais/estaduais e o contexto do comércio Brasil–Argentina. Use o campo 'fonte específica' para marcar a CATEGORIA (ex.: 'Incentivo municipal', 'IBGE', 'Corredor bioceânico') — os dados são agrupados por ela."
        rotuloItem="dado"
        resumo={(evs) => {
          const comFonte = evs.filter((e) => e.confianca !== 'baixa').length;
          const aConfirmar = evs.length - comFonte;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, borderLeft: `3px solid ${aConfirmar > 0 ? 'var(--amber)' : 'var(--green)'}`, paddingLeft: 10 }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{comFonte} com fonte firme</span>
              <span style={{ color: 'var(--ink-soft)' }}>·</span>
              <span style={{ color: aConfirmar > 0 ? 'var(--amber)' : 'var(--ink-soft)', fontWeight: 700 }}>{aConfirmar} a confirmar (especulação)</span>
            </div>
          );
        }}
        agruparPor={(e) => e.fonteDetalhe?.trim() || 'Sem categoria'}
      />
    </div>
  );
}
