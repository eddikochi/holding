import { useState, type ReactNode } from 'react';
import { mediana } from '../lib/estatistica';

/*
 * Padrão de tabela densa da aba Dados (item 4.1 do SPEC_MODELO_DADOS).
 * REAPROVEITÁVEL por qualquer pilar — a tabela existe para produzir um NÚMERO
 * derivado (a métrica), que é a coluna principal, ordenada, com linha de mediana.
 *
 * Regras que este componente materializa:
 *  - métrica derivada = coluna de ênfase, à direita, peso maior;
 *  - registros ordenados pela métrica (asc), com linha tracejada da mediana;
 *  - números à direita, tabular-nums (via CSS .tam-cel);
 *  - metadado inline discreto fica na coluna primária (responsabilidade do caller);
 *  - registros SEM a métrica saem da comparação → bloco recolhido no rodapé;
 *  - agrupamento por realidade distinta → cada grupo com cabeçalho e mediana próprios.
 * Mobile-first: layout em flex-wrap, sem scroll horizontal (a métrica fica à direita
 * mesmo quando as colunas numéricas quebram para a linha de baixo).
 */

export interface ColunaMediana<T> {
  /** Célula já auto-rotulada (ex.: "656 m²", "R$ 3.500/mês"). */
  celula: (r: T) => ReactNode;
  /** Coluna da métrica derivada (destaque à direita). Só uma deve ter enfase. */
  enfase?: boolean;
  larguraMin?: number;
}

export interface GrupoMediana<T> {
  rotulo: string;
  registros: T[];
}

export function TabelaAgrupadaMediana<T>(props: {
  grupos: GrupoMediana<T>[];
  /** Coluna principal (nome + metadado inline). */
  primaria: (r: T) => ReactNode;
  /** Colunas numéricas; a última costuma ser a métrica (enfase). */
  colunas: ColunaMediana<T>[];
  /** Valor numérico da métrica derivada (ordena + mediana). undefined = incompleto. */
  metrica: (r: T) => number | undefined;
  /** Formata a mediana para o cabeçalho e a linha de referência (ex.: "R$ 14,04/m²"). */
  formatMediana: (n: number) => string;
  keyDe: (r: T) => string;
  acoes?: (r: T) => ReactNode;
  /** Rótulo do bloco de incompletos (ex.: (n) => `${n} sem m² — fora do cálculo`). */
  rotuloSemMetrica: (n: number) => string;
}) {
  const grupos = props.grupos.filter((g) => g.registros.length > 0);
  return (
    <div>
      {grupos.map((g) => (
        <Grupo key={g.rotulo} grupo={g} {...props} />
      ))}
    </div>
  );
}

function Grupo<T>({
  grupo, primaria, colunas, metrica, formatMediana, keyDe, acoes, rotuloSemMetrica,
}: {
  grupo: GrupoMediana<T>;
  primaria: (r: T) => ReactNode;
  colunas: ColunaMediana<T>[];
  metrica: (r: T) => number | undefined;
  formatMediana: (n: number) => string;
  keyDe: (r: T) => string;
  acoes?: (r: T) => ReactNode;
  rotuloSemMetrica: (n: number) => string;
}) {
  const [abrirInc, setAbrirInc] = useState(false);

  const comMetrica = grupo.registros
    .map((r) => ({ r, v: metrica(r) }))
    .filter((x): x is { r: T; v: number } => x.v != null && Number.isFinite(x.v))
    .sort((a, b) => a.v - b.v);
  const incompletos = grupo.registros.filter((r) => {
    const v = metrica(r);
    return v == null || !Number.isFinite(v);
  });
  const med = mediana(comMetrica.map((x) => x.v));
  const split = med == null ? -1 : comMetrica.filter((x) => x.v < med).length;

  return (
    <div className="tam-grupo">
      <div className="tam-cab">
        <div><b>{grupo.rotulo}</b> <span className="tam-count">({comMetrica.length})</span></div>
        {med != null && <div className="tam-mediana">mediana {formatMediana(med)}</div>}
      </div>

      {comMetrica.map((x, i) => (
        <div key={keyDe(x.r)}>
          {i === split && med != null && (
            <div className="tam-linha-mediana"><span>mediana {formatMediana(med)}</span></div>
          )}
          <Linha r={x.r} primaria={primaria} colunas={colunas} acoes={acoes} />
        </div>
      ))}

      {incompletos.length > 0 && (
        <div className="tam-incompletos">
          <button type="button" className="tam-inc-toggle" aria-expanded={abrirInc} onClick={() => setAbrirInc((v) => !v)}>
            {abrirInc ? '▾' : '▸'} {rotuloSemMetrica(incompletos.length)}
          </button>
          {abrirInc && incompletos.map((r) => (
            <Linha key={keyDe(r)} r={r} primaria={primaria} colunas={colunas} acoes={acoes} semMetrica />
          ))}
        </div>
      )}
    </div>
  );
}

function Linha<T>({ r, primaria, colunas, acoes, semMetrica }: {
  r: T;
  primaria: (r: T) => ReactNode;
  colunas: ColunaMediana<T>[];
  acoes?: (r: T) => ReactNode;
  semMetrica?: boolean;
}) {
  return (
    <div className="tam-row">
      <div className="tam-primaria">{primaria(r)}</div>
      {colunas.map((c, i) => (
        <div key={i} className={`tam-cel${c.enfase ? ' tam-enfase' : ''}`} style={c.larguraMin ? { minWidth: c.larguraMin } : undefined}>
          {semMetrica && c.enfase ? '—' : c.celula(r)}
        </div>
      ))}
      {acoes && <div className="tam-acoes">{acoes(r)}</div>}
    </div>
  );
}
