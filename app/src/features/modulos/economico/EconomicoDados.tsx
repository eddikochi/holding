import { EvidenciasPanel } from '../EvidenciasPanel';

/**
 * Aba "Dados" do módulo 04 Econômico. Reúsa EvidenciasPanel com separação
 * visual fato/especulação (spec). Todo dado tem fonte; sem fonte é especulação.
 */
export function EconomicoDados() {
  return (
    <div>
      <div className="alerta">
        Regra deste módulo: <b>nunca invente número</b>. Todo dado entra com a fonte de onde veio
        (IBGE, prefeitura, notícia, etc.) e a data. O que não tem fonte firme fica separado como
        "a confirmar / especulação" — inclusive as expectativas sobre o corredor bioceânico.
      </div>

      <EvidenciasPanel
        pilar="economico"
        titulo="Dados econômicos, incentivos e corredor bioceânico"
        ajuda="Demografia, economia da região, incentivos municipais/estaduais e o contexto do comércio Brasil–Argentina. Use o campo 'fonte específica' para marcar a categoria (ex.: 'Incentivo municipal', 'IBGE', 'Corredor bioceânico')."
        separarFatoEspeculacao
        rotuloItem="dado"
      />
    </div>
  );
}
