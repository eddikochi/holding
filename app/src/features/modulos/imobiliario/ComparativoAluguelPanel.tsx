/**
 * Fase 5 — comparativo R$/m² de aluguel: NOSSAS UNIDADES × mediana de mercado.
 * A leitura (barras) é só-visual; o seletor de tipo por unidade é a parte "manual"
 * da Opção B (grava em Config, não toca a entidade Unidade). Mobile-first.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CONFIG_IMOB_UNIDADE_TIPO } from '../../../db/database';
import { salvarTipoComparacaoUnidade } from '../../../db/actions';
import { comparativoAluguelPorUnidade, type LinhaComparativo } from '../../../lib/calc/comparativoAluguel';
import type { TipoAtivo } from '../../../models/types';

const TIPO_ROTULO: Record<TipoAtivo, string> = {
  galpao: 'Galpão', loja: 'Loja', terreno: 'Terreno', oficina: 'Oficina', outro: 'Outro',
};
const brlM2 = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²`;

export function ComparativoAluguelPanel() {
  const dados = useLiveQuery(async () => {
    const [ativos, comparaveis, cfg] = await Promise.all([
      db.ativos.toArray(),
      db.comparaveis.toArray(),
      db.config.get(CONFIG_IMOB_UNIDADE_TIPO),
    ]);
    const mapa = (cfg?.valor && typeof cfg.valor === 'object' ? cfg.valor : {}) as Record<string, TipoAtivo>;
    return { comp: comparativoAluguelPorUnidade(ativos, comparaveis, mapa), mapa };
  });

  if (!dados) return <div className="panel">Carregando…</div>;
  const { comp, mapa } = dados;
  const { linhas, contagens, maxRpm } = comp;

  // Só unidades com aluguel entram na tela; 'ausente' (sem aluguel) fica no rodapé contado.
  const comparaveis = linhas.filter((l) => l.estado === 'plota' || l.estado === 'sem_mercado');
  const semArea = linhas.filter((l) => l.estado === 'alerta_falta');
  const escala = maxRpm > 0 ? maxRpm * 1.1 : 1;

  return (
    <div className="panel">
      <h2>Nossos imóveis × mercado (R$/m² de aluguel)</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0, fontSize: 13 }}>
        Aluguel mensal ÷ área construída de cada unidade, comparado à mediana de mercado do tipo
        (dos comparáveis). Barra âmbar = abaixo do mercado (espaço para reajustar); verde = no mercado ou acima.
      </p>

      {linhas.length === 0 ? (
        <div className="empty-state"><p>Cadastre imóveis subdivididos em unidades (módulo 01) com aluguel e área para comparar.</p></div>
      ) : (
        <>
          {comparaveis.length > 0 && (
            <div className="cmp-lista">
              {comparaveis.map((l) => (
                <LinhaUnidade key={l.unidadeId} l={l} escala={escala} tipoNoMapa={mapa[l.unidadeId]} />
              ))}
            </div>
          )}

          {semArea.length > 0 && (
            <div className="cmp-alerta">
              <b>⚠ Falta área para calcular R$/m²</b>
              <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                Têm aluguel, mas sem área construída medida. Meça a área na unidade (módulo 01) para entrarem no gráfico.
              </p>
              {semArea.map((l) => (
                <div key={l.unidadeId} className="cmp-alerta-linha">
                  <span><b>{l.nome}</b> <span className="cmp-sub">· {l.ativoNome}</span></span>
                  <span className="cmp-sub">{l.aluguel ? `R$ ${l.aluguel.toLocaleString('pt-BR')}/mês` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {contagens.ausente > 0 && (
            <p className="cmp-rodape">{contagens.ausente} unidade(s) sem aluguel informado — fora da comparação.</p>
          )}
        </>
      )}
    </div>
  );
}

function LinhaUnidade({ l, escala, tipoNoMapa }: { l: LinhaComparativo; escala: number; tipoNoMapa?: TipoAtivo }) {
  const abaixo = l.estado === 'plota' && (l.delta ?? 0) < 0;
  // sem_mercado não tem referência → barra neutra (não sugere acima/abaixo). plota: âmbar abaixo, verde no/acima.
  const corBarra = l.estado === 'sem_mercado' ? 'var(--ink-soft)' : abaixo ? 'var(--amber)' : 'var(--green)';
  const larguraNossa = `${Math.min(100, ((l.rpm ?? 0) / escala) * 100)}%`;
  const posMediana = l.medianaMercado != null ? `${(l.medianaMercado / escala) * 100}%` : null;

  return (
    <div className="cmp-row">
      <div className="cmp-cab">
        <div className="cmp-nome"><b>{l.nome}</b> <span className="cmp-sub">· {l.ativoNome}</span></div>
        <SeletorTipo unidadeId={l.unidadeId} valorNoMapa={tipoNoMapa} tipoEfetivo={l.tipoComparacao} />
      </div>

      <div className="cmp-barra-wrap">
        <div className="cmp-barra-track">
          <div className="cmp-barra-fill" style={{ width: larguraNossa, background: corBarra }} />
          {posMediana && <div className="cmp-mediana-marca" style={{ left: posMediana }} title="mediana de mercado" />}
        </div>
      </div>

      <div className="cmp-numeros">
        <span className="cmp-nosso" style={{ color: corBarra }}>{l.rpm != null ? brlM2(l.rpm) : '—'}</span>
        {l.estado === 'plota' && l.medianaMercado != null ? (
          <span className="cmp-sub">
            {l.deltaPct != null && `${l.deltaPct >= 0 ? '+' : ''}${l.deltaPct.toFixed(0)}% vs mercado`}
            {' · '}mediana {TIPO_ROTULO[l.tipoComparacao]} {brlM2(l.medianaMercado)}
          </span>
        ) : (
          <span className="cmp-sub cmp-sem-mercado">sem comparável de mercado para {TIPO_ROTULO[l.tipoComparacao].toLowerCase()}</span>
        )}
      </div>
    </div>
  );
}

/** Seletor manual do tipo de comparação (Opção B). Vazio = usa o tipo do ativo pai. */
function SeletorTipo({ unidadeId, valorNoMapa, tipoEfetivo }: { unidadeId: string; valorNoMapa?: TipoAtivo; tipoEfetivo: TipoAtivo }) {
  return (
    <label className="cmp-seletor">
      <span className="cmp-sub">comparar com</span>
      <select
        value={valorNoMapa ?? ''}
        onChange={(e) => salvarTipoComparacaoUnidade(unidadeId, (e.target.value || undefined) as TipoAtivo | undefined)}
      >
        <option value="">tipo do imóvel ({TIPO_ROTULO[tipoEfetivo].toLowerCase()})</option>
        {(Object.keys(TIPO_ROTULO) as TipoAtivo[]).map((t) => (
          <option key={t} value={t}>{TIPO_ROTULO[t]}</option>
        ))}
      </select>
    </label>
  );
}
