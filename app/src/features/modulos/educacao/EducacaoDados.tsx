import { StakeholdersPanel } from '../StakeholdersPanel';
import { EvidenciasPanel } from '../EvidenciasPanel';

/**
 * Aba "Dados" do módulo 08 Educação / Economia Estudantil.
 * Players estudantis (estudantes, instituições, locadores) com roteiro, e
 * evidências/dados do pilar. O funil fica na aba Discovery; hipóteses iniciais
 * sugeridas podem ser adicionadas lá com um clique.
 */
export function EducacaoDados() {
  return (
    <div>
      <div className="alerta">
        São Borja é cidade universitária. Este pilar cruza com <b>Econômico</b> e <b>Imobiliário</b> —
        ao criar oportunidades, marque mais de um pilar quando fizer sentido. O fluxo transfronteiriço
        de estudantes é <b>hipótese a validar</b>, não fato fechado.
      </div>

      <StakeholdersPanel
        pilar="educacao"
        titulo="Players do ecossistema estudantil"
        ajuda="Estudantes, instituições de ensino, locadores de moradia, comércio no entorno dos campi. Use o roteiro de entrevista ao cadastrar."
      />

      <EvidenciasPanel
        pilar="educacao"
        titulo="Dados e evidências do pilar"
        ajuda="Nº de alunos por instituição (com fonte), oferta de moradia, custo de vida, fluxo transfronteiriço. Estimativas sem fonte firme entram como 'a confirmar'."
        separarFatoEspeculacao
        rotuloItem="dado/evidência"
      />
    </div>
  );
}
