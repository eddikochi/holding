import { useParams, Link } from 'react-router-dom';
import { moduloPorSlug } from '../../modulos';
import { ONBOARDING } from '../../content/onboarding';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

/**
 * Shell genérico de módulo para a Fase 1: mostra o onboarding real (o "porquê")
 * e um estado vazio explicando que os dados/análise chegam nas próximas fases.
 * Fases 2+ substituem o corpo por Onboarding / Dados / Análise específicos.
 */
export function ModuloShell() {
  const { slug = '' } = useParams();
  const modulo = moduloPorSlug(slug);
  const onb = ONBOARDING[slug];

  if (!modulo || !onb) {
    return (
      <div>
        <PageHeader titulo="Módulo não encontrado" />
        <div className="panel">
          <EmptyState titulo="Esse módulo não existe">
            Volte para a <Link to="/">visão geral</Link> e escolha um dos 12 módulos.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker={`Módulo ${modulo.num}`}
        titulo={modulo.nome}
        descricao={onb.oQueResponde}
      />

      <div className="panel">
        <h2>Por que este diagnóstico importa</h2>
        <p style={{ color: 'var(--ink-soft)' }}>{onb.porQueImporta}</p>

        <h3 style={{ marginTop: 16 }}>Onde coletar os dados</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.ondeColetar}</p>

        <h3 style={{ marginTop: 16 }}>Critério de "pronto"</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{onb.criterioPronto}</p>
      </div>

      <div className="panel">
        <EmptyState
          titulo="Dados e análise deste módulo chegam nas próximas fases"
          acao={
            <Link className="btn secondary" to="/importar">
              Importar dados de campo
            </Link>
          }
        >
          Esta é a Fase 1 (Fundação): a estrutura e a persistência já funcionam. Os formulários,
          tabelas e a análise (SWOT + leitura executiva) deste diagnóstico entram nas fases
          seguintes. Enquanto isso, você já pode importar seus dados de campo — eles ficam
          guardados e aparecem aqui quando o módulo for construído.
        </EmptyState>
      </div>
    </div>
  );
}
