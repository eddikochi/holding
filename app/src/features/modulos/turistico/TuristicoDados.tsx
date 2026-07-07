import { EvidenciasPanel } from '../EvidenciasPanel';

/**
 * Aba "Dados" do módulo 07 Turístico. Marca visualmente que este pilar tende a ser
 * projeto separado — não deve ser misturado na priorização dos demais por default.
 */
export function TuristicoDados() {
  return (
    <div>
      <div className="alerta" style={{ borderLeftColor: 'var(--blue)', background: 'var(--blue-soft)' }}>
        <b>Este pilar tende a virar um projeto separado.</b> Missões, patrimônio histórico, Guerra do
        Paraguai e identidade local têm valor, mas seguem uma lógica diferente dos negócios logístico,
        imobiliário e do agro. Registre aqui sem misturar com a decisão de investimento dos outros
        pilares — na priorização (módulo 09), este pilar só entra se você incluir de propósito.
      </div>

      <EvidenciasPanel
        pilar="turistico"
        titulo="Inventário de atrativos e ideias"
        ajuda="Atrativos (Missões, patrimônio, história), fluxo turístico estimado e ideias de experiência/conteúdo. Fluxo estimado sem fonte firme entra como 'a confirmar'."
        separarFatoEspeculacao
        rotuloItem="atrativo/ideia"
      />
    </div>
  );
}
