import type { ReactNode } from 'react';
import type { Modulo } from '../../modulos';
import { ONBOARDING } from '../../content/onboarding';
import { PageHeader } from '../../components/PageHeader';
import { Tabs } from '../../components/Tabs';
import { AnaliseTab } from './AnaliseTab';

/** Onboarding didático reutilizável (aba 1 dos diagnósticos). */
export function OnboardingTab({ slug }: { slug: string }) {
  const onb = ONBOARDING[slug];
  if (!onb) return null;
  return (
    <div className="panel">
      <h2>O que este diagnóstico responde</h2>
      <p style={{ color: 'var(--ink-soft)' }}>{onb.oQueResponde}</p>
      <h3 style={{ marginTop: 16 }}>Por que importa antes de investir</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.porQueImporta}</p>
      <h3 style={{ marginTop: 16 }}>Onde coletar os dados</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.ondeColetar}</p>
      <h3 style={{ marginTop: 16 }}>Critério de "pronto"</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.criterioPronto}</p>
    </div>
  );
}

/**
 * Casca padrão de um módulo de diagnóstico com as 3 abas fixas da spec:
 * Onboarding · Dados · Análise. O conteúdo da aba Dados é específico de cada módulo.
 */
export function DiagnosticoLayout({ modulo, dados }: { modulo: Modulo; dados: ReactNode }) {
  const onb = ONBOARDING[modulo.slug];
  return (
    <div>
      <PageHeader
        kicker={`Módulo ${modulo.num}`}
        titulo={modulo.nome}
        descricao={onb?.oQueResponde}
      />
      <Tabs
        inicial="dados"
        abas={[
          { id: 'onboarding', rotulo: 'Onboarding', conteudo: <OnboardingTab slug={modulo.slug} /> },
          { id: 'dados', rotulo: 'Dados', conteudo: dados },
          {
            id: 'analise',
            rotulo: 'Análise',
            conteudo: modulo.pilar ? <AnaliseTab pilar={modulo.pilar} /> : null,
          },
        ]}
      />
    </div>
  );
}
