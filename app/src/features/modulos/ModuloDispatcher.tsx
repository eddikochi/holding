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
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import type { ReactNode } from 'react';

/** Aba "Dados" específica por módulo (os construídos na Fase 2). */
const DADOS_POR_MODULO: Record<string, ReactNode> = {
  patrimonial: <PatrimonialDados />,
  juridico: <JuridicoDados />,
  logistico: <LogisticoDados />,
  imobiliario: <ImobiliarioDados />,
  economico: <EconomicoDados />,
  agroindustrial: <AgroindustrialDados />,
  turistico: <TuristicoDados />,
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

  const dados = DADOS_POR_MODULO[slug];
  if (dados) {
    return <DiagnosticoLayout modulo={modulo} dados={dados} />;
  }
  return <ModuloShell />;
}
