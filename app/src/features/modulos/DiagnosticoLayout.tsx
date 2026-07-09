import { useEffect, useState, type ReactNode } from 'react';
import type { Modulo } from '../../modulos';
import type { Pilar } from '../../models/types';
import { ONBOARDING } from '../../content/onboarding';
import { DISCOVERY_PILAR } from '../../content/discovery';
import { onboardingVisto, marcarOnboardingVisto } from '../../db/actions';
import { PageHeader } from '../../components/PageHeader';
import { Tabs } from '../../components/Tabs';
import { AnaliseTab } from './AnaliseTab';
import { DiscoveryPanel } from './DiscoveryPanel';
import { ChecklistDiscovery } from './ChecklistDiscovery';

/** Aba de Onboarding didática: o que descobrir, porquê, quem procurar, checklist, critério. */
export function OnboardingTab({ slug }: { slug: string }) {
  const onb = ONBOARDING[slug];
  if (!onb) return null;
  const disc = DISCOVERY_PILAR[slug as Pilar];

  return (
    <div>
      {disc && (
        <div className="panel" style={{ borderLeft: '4px solid var(--blue)' }}>
          <h2>O que estamos tentando descobrir</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>O enquadramento da investigação deste pilar. Leia antes de começar.</p>
          <ol style={{ color: 'var(--ink)', margin: 0, paddingLeft: 18 }}>
            {disc.perguntasMestre.map((q, i) => <li key={i} style={{ margin: '6px 0' }}>{q}</li>)}
          </ol>
        </div>
      )}

      <div className="panel">
        <h2>O que este diagnóstico responde</h2>
        <p style={{ color: 'var(--ink-soft)' }}>{onb.oQueResponde}</p>
        <h3 style={{ marginTop: 16 }}>Por que fazer antes de investir</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.porQueImporta}</p>
      </div>

      {disc && (
        <div className="panel">
          <h2>Quem procurar em campo</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Os tipos de contato a buscar neste pilar e a dor/oportunidade a investigar em cada um.</p>
          <table>
            <thead><tr><th>Tipo de player</th><th>O que investigar</th></tr></thead>
            <tbody>
              {disc.tiposPlayers.map((t, i) => (
                <tr key={i}><td><b>{t.tipo}</b></td><td>{t.investigar}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChecklistDiscovery slug={slug} />

      <div className="panel">
        <h2>Critério de "pronto"</h2>
        <ul style={{ color: 'var(--ink-soft)' }}>{onb.criterioPronto.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
    </div>
  );
}

/**
 * Casca padrão de um diagnóstico: 4 abas (Onboarding / Dados / Discovery / Análise).
 * Na primeira visita ao módulo, abre no Onboarding; depois abre em Dados, com um
 * botão "?" no cabeçalho para reabrir o Onboarding.
 */
export function DiagnosticoLayout({ modulo, dados }: { modulo: Modulo; dados: ReactNode }) {
  const onb = ONBOARDING[modulo.slug];
  const [aba, setAba] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    onboardingVisto(modulo.slug).then((visto) => {
      if (!vivo) return;
      if (!visto) { setAba('onboarding'); marcarOnboardingVisto(modulo.slug); }
      else setAba('dados');
    });
    return () => { vivo = false; };
  }, [modulo.slug]);

  return (
    <div>
      <PageHeader
        kicker={`Módulo ${modulo.num}`}
        titulo={modulo.nome}
        descricao={onb?.oQueResponde}
        acoes={<button className="btn ghost small" title="Ver o onboarding deste módulo" onClick={() => setAba('onboarding')}>? Onboarding</button>}
      />
      {aba && (
        <Tabs
          ativa={aba}
          aoMudar={setAba}
          abas={[
            { id: 'onboarding', rotulo: 'Onboarding', conteudo: <OnboardingTab slug={modulo.slug} /> },
            { id: 'dados', rotulo: 'Dados', conteudo: dados },
            { id: 'discovery', rotulo: 'Discovery', conteudo: modulo.pilar ? <DiscoveryPanel pilar={modulo.pilar} /> : null },
            { id: 'analise', rotulo: 'Análise', conteudo: modulo.pilar ? <AnaliseTab pilar={modulo.pilar} /> : null },
          ]}
        />
      )}
    </div>
  );
}
