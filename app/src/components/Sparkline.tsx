/** Mini-gráfico de linha em SVG puro (sem biblioteca). Para evolução de KPIs. */
export function Sparkline({ valores, largura = 120, altura = 32 }: { valores: number[]; largura?: number; altura?: number }) {
  if (valores.length < 2) {
    return <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{valores.length === 1 ? '1 medição' : 'sem medições'}</span>;
  }
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const passo = largura / (valores.length - 1);
  const pontos = valores.map((v, i) => {
    const x = i * passo;
    const y = altura - ((v - min) / span) * (altura - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const subindo = valores[valores.length - 1] >= valores[0];
  const cor = subindo ? 'var(--green)' : 'var(--red)';
  return (
    <svg className="sparkline" width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="evolução">
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
