import { alpha } from '@mui/material/styles';
import { primary, surface } from '../../../../theme/tokens';
import { overlayWhite } from '../../../../theme/overlays';

export interface SparklineProps {
  valores: number[];
  width?: number;
  height?: number;
  labelInicio?: string;
  labelFim?: string;
}

/** Linha simples em SVG (sem Recharts) — o gráfico completo é o `PMCChart`, expansível ao lado. */
export function Sparkline({ valores, width = 326, height = 72, labelInicio, labelFim }: SparklineProps) {
  if (valores.length < 2) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const topo = 10;
  const base = height - 12;
  const pts = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * width;
    const y = base - ((v - min) / span) * (base - topo);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [ux, uy] = pts[pts.length - 1];
  return (
    // Largura fluida: o viewBox mantém a geometria; o SVG ocupa o card (390 no telefone, 640 no desktop).
    <svg data-testid="progress-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Evolução do condicionamento nas últimas semanas" style={{ width: '100%', height, display: 'block' }}>
      <line x1="0" y1={base} x2={width} y2={base} stroke={overlayWhite[12]} strokeWidth="1" />
      <path d={`${d} L ${width} ${base} L 0 ${base} Z`} fill={alpha(primary[500], 0.1)} />
      <path d={d} fill="none" stroke={primary[500]} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r="4" fill={primary[500]} />
      {labelInicio && <text x="0" y={height - 1} fontFamily="JetBrains Mono, monospace" fontSize="11" fill={surface[500]}>{labelInicio}</text>}
      {labelFim && <text x={width} y={height - 1} fontFamily="JetBrains Mono, monospace" fontSize="11" fill={surface[500]} textAnchor="end">{labelFim}</text>}
    </svg>
  );
}
