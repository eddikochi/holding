import { StakeholdersPanel } from '../StakeholdersPanel';
import { EvidenciasPanel } from '../EvidenciasPanel';
import { SazonalidadeEditor } from './SazonalidadeEditor';

/** Aba "Dados" do módulo 06 Agroindustrial — players, sazonalidade, demandas e parcerias. */
export function AgroindustrialDados() {
  return (
    <div>
      <StakeholdersPanel
        pilar="agroindustrial"
        titulo="Players do agro"
        ajuda="Produtores, cooperativas, agroindústrias, prestadores de serviço ao produtor."
      />
      <SazonalidadeEditor />
      <EvidenciasPanel
        pilar="agroindustrial"
        titulo="Demandas e parcerias"
        ajuda="Demandas de armazenagem, beneficiamento e serviços ao produtor; possíveis parcerias. Registre com a fonte (quem falou, onde viu)."
        rotuloItem="registro"
      />
    </div>
  );
}
