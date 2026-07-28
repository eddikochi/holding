/**
 * Zona 2 — mapa (a) evidência × validação. Componente APENAS de apresentação:
 * recebe os pontos já derivados (lib/calc/mapaDecisao) e desenha o 2×2.
 *
 * Eixo X = peso de evidência (nº sustenta) · Eixo Y = grau de validação (status).
 * Bolha: posição = X×Y · tamanho = evidência acumulada · anel vermelho = tem refuta.
 * Só leitura. Nenhuma gravação, nenhum schema.
 */
import { useMemo, useState } from 'react';
import type { PontoHipotese } from '../../lib/calc/mapaDecisao';
import type { StatusHipotese } from '../../models/types';

/** Nível vertical de cada status (refutada não entra no 2×2 — é desfecho terminal). */
const NIVEL_Y: Record<Exclude<StatusHipotese, 'refutada'>, number> = {
  nao_validada: 0, // base
  parcial: 1,      // meio
  validada: 2,     // topo
};

const COR_STATUS: Record<StatusHipotese, string> = {
  nao_validada: 'var(--ink-soft)',
  parcial: 'var(--amber)',
  validada: 'var(--green)',
  refutada: 'var(--red)',
};

// Geometria do viewBox (retrato, cabe em tela de celular a 100% de largura).
const W = 320;
const H = 300;
const M = { top: 14, right: 14, bottom: 46, left: 46 };
const PLOT = { x0: M.left, x1: W - M.right, y0: M.top, y1: H - M.bottom };
const PLOT_W = PLOT.x1 - PLOT.x0;
const PLOT_H = PLOT.y1 - PLOT.y0;

interface Geo extends PontoHipotese {
  cx: number;
  cy: number;
  r: number;
}

export function MapaEvidenciaValidacao({
  pontos,
  maxSustenta,
}: {
  pontos: PontoHipotese[];
  maxSustenta: number;
}) {
  const [sel, setSel] = useState<string | null>(null);

  // Só as hipóteses "vivas" vão ao mapa; refutadas são desfecho terminal (listadas à parte).
  const vivas = pontos.filter((p) => p.status !== 'refutada');

  const geo = useMemo(() => calcularGeometria(vivas, maxSustenta), [vivas, maxSustenta]);

  // Eixo X = evidência (contínuo, sem limiar). Único divisor é o de VALIDAÇÃO (eixo Y),
  // que vem do campo `status` — real. O limiar de evidência é regra de negócio (backlog),
  // então não se desenha corte vertical: seria sugerir um limiar que não existe.
  const domX = Math.max(maxSustenta, 1) + 1;
  const xDoValor = (v: number) => PLOT.x0 + (v / domX) * PLOT_W;
  const yDivisor = PLOT.y0 + PLOT_H * (1 - 0.34); // "não validada" fica no terço inferior

  const selecionado = geo.find((g) => g.id === sel) ?? null;

  return (
    <div className="mapa-ev">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mapa de evidência por validação" className="mapa-ev-svg">
        {/* Faixa "validada" (topo) = zona-alvo. Fica visivelmente vazia se nenhuma hipótese
            estiver validada — é o estado real. Tinta só a faixa de cima, tudo acima do divisor real. */}
        <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={yDivisor - PLOT.y0} className="faixa-validada" />

        {/* Rótulos das faixas de validação (eixo Y real). O eixo X não tem faixas: é contínuo. */}
        <text x={PLOT.x1 - 4} y={PLOT.y0 + 12} className="q-lbl" textAnchor="end">validada / parcial</text>
        <text x={PLOT.x1 - 4} y={PLOT.y1 - 6} className="q-lbl" textAnchor="end">não validada</text>

        {/* Único divisor: validação (status). Sem corte vertical — o eixo X não tem limiar. */}
        <line x1={PLOT.x0} y1={yDivisor} x2={PLOT.x1} y2={yDivisor} className="divisor" />

        {/* Eixos */}
        <line x1={PLOT.x0} y1={PLOT.y1} x2={PLOT.x1} y2={PLOT.y1} className="eixo" />
        <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y1} className="eixo" />

        {/* Ticks do eixo X: só 0 e o máximo observado. Nenhum limiar marcado. */}
        <text x={PLOT.x0} y={PLOT.y1 + 14} className="tick" textAnchor="middle">0</text>
        {maxSustenta > 0 && (
          <text x={xDoValor(maxSustenta)} y={PLOT.y1 + 14} className="tick" textAnchor="middle">{maxSustenta}</text>
        )}

        {/* Rótulos dos eixos */}
        <text x={(PLOT.x0 + PLOT.x1) / 2} y={H - 6} className="eixo-lbl" textAnchor="middle">
          → peso de evidência (nº que sustenta)
        </text>
        <text x={12} y={(PLOT.y0 + PLOT.y1) / 2} className="eixo-lbl" textAnchor="middle" transform={`rotate(-90 12 ${(PLOT.y0 + PLOT.y1) / 2})`}>
          → grau de validação
        </text>

        {/* Bolhas */}
        {geo.map((g) => {
          const semVinculo = g.totalVinculada === 0;
          return (
            <g key={g.id} className={'bolha' + (sel === g.id ? ' sel' : '')} onClick={() => setSel(sel === g.id ? null : g.id)}>
              <title>{tooltip(g)}</title>
              {/* Anel de refuta */}
              {g.refuta > 0 && <circle cx={g.cx} cy={g.cy} r={g.r + 3} className="anel-refuta" />}
              <circle
                cx={g.cx}
                cy={g.cy}
                r={g.r}
                fill={semVinculo ? 'transparent' : COR_STATUS[g.status]}
                stroke={COR_STATUS[g.status]}
                strokeDasharray={semVinculo ? '3 2' : undefined}
                fillOpacity={semVinculo ? 1 : 0.55}
                strokeWidth={1.5}
              />
              <text x={g.cx} y={g.cy + 3} className="bolha-lbl" textAnchor="middle">
                {(g.codigo ?? '').replace('HIP-', '')}
              </text>
              {g.refuta > 0 && (
                <text x={g.cx + g.r + 3} y={g.cy - g.r} className="badge-refuta" textAnchor="middle">
                  {g.refuta}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Detalhe da bolha selecionada (macro → micro leve; drill completo é Gate futuro) */}
      {selecionado && (
        <div className="mapa-detalhe">
          <div className="md-cod">{selecionado.codigo ?? 'HIP'} · <span className={'st st-' + selecionado.status}>{rotuloStatus(selecionado.status)}</span></div>
          <div className="md-enun">{selecionado.enunciado || '(sem enunciado)'}</div>
          <div className="md-nums">
            <span className="ok">{selecionado.sustenta} sustenta</span>
            {selecionado.refuta > 0 && <span className="ru">{selecionado.refuta} refuta</span>}
            {selecionado.neutro > 0 && <span className="nu">{selecionado.neutro} neutro</span>}
          </div>
          {selecionado.pilares.length > 0 && <div className="md-pil">{selecionado.pilares.join(' · ')}</div>}
        </div>
      )}

      {/* Legenda */}
      <div className="mapa-legenda">
        <span><i className="dot" style={{ background: 'var(--ink-soft)' }} /> não validada</span>
        <span><i className="dot" style={{ background: 'var(--amber)' }} /> parcial</span>
        <span><i className="dot" style={{ background: 'var(--green)' }} /> validada</span>
        <span><i className="dot ring" /> tem refuta</span>
        <span><i className="dot dash" /> sem evidência</span>
        <span className="leg-obs">tamanho = evidência acumulada</span>
      </div>
    </div>
  );
}

/** Beeswarm simples: posiciona por X, e empurra na vertical (dentro da faixa do status) para não sobrepor. */
function calcularGeometria(pontos: PontoHipotese[], maxSustenta: number): Geo[] {
  const domX = Math.max(maxSustenta, 1) + 1; // + folga p/ não colar na borda direita
  const xDe = (s: number) => PLOT.x0 + (s / domX) * PLOT_W;

  // 3 faixas verticais (base/meio/topo). Centro de cada faixa.
  const faixaH = PLOT_H / 3;
  const yCentro = (nivel: number) => PLOT.y1 - faixaH * (nivel + 0.5);
  const rDe = (total: number) => 6 + Math.min(total, 8) * 1.3; // 6..16

  const colocados: Geo[] = [];
  // Ordena por faixa e por X para o empurrão ser estável.
  const ordenado = [...pontos].sort((a, b) => a.status.localeCompare(b.status) || a.sustenta - b.sustenta);

  for (const p of ordenado) {
    const nivel = p.status === 'refutada' ? 0 : NIVEL_Y[p.status];
    const r = rDe(p.totalVinculada);
    const cx = xDe(p.sustenta);
    const base = yCentro(nivel);
    const limSup = PLOT.y0 + faixaH * (2 - nivel) + r + 1;
    const limInf = PLOT.y1 - faixaH * nivel - r - 1;
    let cy = base;
    // Tenta o centro; se colidir, alterna para cima/baixo em passos até achar espaço na faixa.
    for (let passo = 0; passo < 24; passo++) {
      const tent = base + (passo % 2 === 0 ? 1 : -1) * Math.ceil(passo / 2) * 7;
      if (tent < limSup || tent > limInf) continue;
      const colide = colocados.some((c) => {
        const dx = c.cx - cx;
        const dy = c.cy - tent;
        return Math.hypot(dx, dy) < c.r + r + 2;
      });
      if (!colide) { cy = tent; break; }
      cy = tent; // guarda a última tentativa como fallback
    }
    colocados.push({ ...p, cx, cy, r });
  }
  return colocados;
}

function tooltip(p: PontoHipotese): string {
  const partes = [
    `${p.codigo ?? 'HIP'} — ${rotuloStatus(p.status)}`,
    p.enunciado || '(sem enunciado)',
    `sustenta ${p.sustenta} · refuta ${p.refuta} · neutro ${p.neutro}`,
  ];
  return partes.join('\n');
}

function rotuloStatus(s: StatusHipotese): string {
  return { nao_validada: 'não validada', parcial: 'parcial', validada: 'validada', refutada: 'refutada' }[s];
}
