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

// Geometria do viewBox: paisagem (largura > altura). O eixo X (evidência, contínuo)
// é o informativo → ganha largura; o Y só distingue 2 faixas (validada/não) → altura mínima.
// O tamanho absoluto é limitado no CSS (.mapa-ev-svg max-width) para não dominar a tela.
const W = 380;
const H = 240;
const M = { top: 14, right: 14, bottom: 44, left: 46 };
const PLOT = { x0: M.left, x1: W - M.right, y0: M.top, y1: H - M.bottom };
const PLOT_W = PLOT.x1 - PLOT.x0;
const PLOT_H = PLOT.y1 - PLOT.y0;

// Folga à esquerda: valor 0 fica ligeiramente à direita do eixo Y (a bolha não cruza a linha).
const GUT = 18;
// A faixa "não validada" ocupa 60% de baixo — é onde os dados se concentram (estado real:
// muita hipótese sem validação, várias sem evidência empilhadas em x=0). "parcial" e "validada"
// dividem os 40% de cima (20% cada).
const FRAC_NV = 0.6;
const xNoEixo = (v: number, dom: number) => PLOT.x0 + GUT + (v / dom) * (PLOT_W - GUT);
// As faixas "parcial" e "validada" dividem o que sobra acima de "não validada" (metade cada).
const FAIXA_TOPO = (1 - FRAC_NV) / 2;
// Frações verticais (medidas de BAIXO) [início, fim] de cada nível: 0 não validada, 1 parcial, 2 validada.
const FAIXAS: [number, number][] = [
  [0, FRAC_NV],
  [FRAC_NV, FRAC_NV + FAIXA_TOPO],
  [FRAC_NV + FAIXA_TOPO, 1],
];
const yDeFracao = (f: number) => PLOT.y1 - PLOT_H * f;
/** Centro vertical da faixa por nível. */
const yCentroFaixa = (nivel: number): number => yDeFracao((FAIXAS[nivel][0] + FAIXAS[nivel][1]) / 2);
/** Bordas [topo, base] da faixa em coords svg (topo < base), para conter o empilhamento. */
const bordasFaixa = (nivel: number): [number, number] => [yDeFracao(FAIXAS[nivel][1]), yDeFracao(FAIXAS[nivel][0])];
/** Linha divisória de validação: topo da faixa "não validada". */
const Y_DIVISOR = yDeFracao(FRAC_NV);

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
  const xDoValor = (v: number) => xNoEixo(v, domX);
  const yDivisor = Y_DIVISOR; // topo da faixa "não validada" (metade inferior)

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
        <text x={xDoValor(0)} y={PLOT.y1 + 14} className="tick" textAnchor="middle">0</text>
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

/** Beeswarm: posiciona por X (evidência) e empurra na vertical, DENTRO da faixa do status, sem sobrepor. */
function calcularGeometria(pontos: PontoHipotese[], maxSustenta: number): Geo[] {
  const domX = Math.max(maxSustenta, 1) + 1; // + folga p/ não colar na borda direita
  const rDe = (total: number) => 6 + Math.min(total, 8) * 1.3; // 6..16

  const colocados: Geo[] = [];
  // Ordena por faixa e por X para o empurrão ser estável.
  const ordenado = [...pontos].sort((a, b) => a.status.localeCompare(b.status) || a.sustenta - b.sustenta);

  for (const p of ordenado) {
    const nivel = p.status === 'refutada' ? 0 : NIVEL_Y[p.status];
    const r = rDe(p.totalVinculada);
    const cx = xNoEixo(p.sustenta, domX);
    const centro = yCentroFaixa(nivel);
    const [topo, base] = bordasFaixa(nivel);
    const limSup = topo + r + 1;
    const limInf = base - r - 1;
    const passoV = r * 2 + 2; // casa com o raio de colisão (c.r+r+2) p/ empilhar sem sobrepor
    let cy = centro;
    // Tenta o centro; se colidir, alterna para cima/baixo em passos até achar espaço na faixa.
    for (let passo = 0; passo < 40; passo++) {
      const tent = centro + (passo % 2 === 0 ? 1 : -1) * Math.ceil(passo / 2) * passoV;
      if (tent < limSup || tent > limInf) continue;
      const colide = colocados.some((c) => Math.hypot(c.cx - cx, c.cy - tent) < c.r + r + 2);
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
