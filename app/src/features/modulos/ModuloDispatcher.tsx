import { useParams, Link } from 'react-router-dom';
import { moduloPorSlug } from '../../modulos';
import { DiagnosticoLayout } from './DiagnosticoLayout';
import { ModuloShell } from './ModuloShell';
import { PatrimonialDados } from './patrimonial/PatrimonialDados';
import { JuridicoDados } from './juridico/JuridicoDados';
import { LogisticoDados } from './logistico/LogisticoDados';
import { ImobiliarioDados } from './imobiliario/ImobiliarioDados';
import { EconomicoDados } from './economico/EconomicoDados';
import { AgroindustrialDados } from './agroindustrial/AgroindustrialDados';
import { TuristicoDados } from './turistico/TuristicoDados';
import { OportunidadesView } from './oportunidades/OportunidadesView';
import { PriorizacaoView } from './priorizacao/PriorizacaoView';
import { BusinessCasesView } from './businesscases/BusinessCasesView';
import { RoadmapView } from './roadmap/RoadmapView';
import { GovernancaView } from './governanca/GovernancaView';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import type { ReactNode } from 'react';

/** Aba "Dados" específica dos diagnósticos (01–07). */
const DADOS_POR_MODULO: Record<string, ReactNode> = {
  patrimonial: <PatrimonialDados />,
  juridico: <JuridicoDados />,
  logistico: <LogisticoDados />,
  imobiliario: <ImobiliarioDados />,
  economico: <EconomicoDados />,
  agroindustrial: <AgroindustrialDados />,
  turistico: <TuristicoDados />,
};

/** Módulos de decisão (08–10): telas próprias, sem o layout de 3 abas. */
const VIEW_POR_MODULO: Record<string, ReactNode> = {
  oportunidades: <OportunidadesView />,
  priorizacao: <PriorizacaoView />,
  'business-cases': <BusinessCasesView />,
  roadmap: <RoadmapView />,
  governanca: <GovernancaView />,
};

/**
 * Decide o que renderizar para /modulo/:slug.
 * Fases 2–3: os 7 diagnósticos (01–07) têm layout completo (3 abas).
 * Módulos 08–12 continuam no shell placeholder até suas fases.
 */
export function ModuloDispatcher() {
  const { slug = '' } = useParams();
  const modulo = moduloPorSlug(slug);

  if (!modulo) {
    return (
      <div>
        <PageHeader titulo="Módulo não encontrado" />
        <div className="panel">
          <EmptyState titulo="Esse módulo não existe">
            Volte para a <Link to="/">visão geral</Link>.
          </EmptyState>
        </div>
      </div>
    );
  }

  const view = VIEW_POR_MODULO[slug];
  if (view) return <>{view}</>;

  const dados = DADOS_POR_MODULO[slug];
  if (dados) {
    return <DiagnosticoLayout modulo={modulo} dados={dados} />;
  }
  return <ModuloShell />;
}
