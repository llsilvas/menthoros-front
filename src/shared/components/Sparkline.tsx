import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { surface, semantic } from '../../theme/tokens';

export interface SparklineProps {
  data: number[];
  variant?: 'line' | 'area';
  width?: number;
  height?: number;
  semantic?: 'positive-up' | 'negative-up' | 'neutral';
  ariaLabel: string;
}

interface DataPoint {
  v: number;
}

function resolveColor(
  data: number[],
  semanticProp: 'positive-up' | 'negative-up' | 'neutral',
): string {
  if (semanticProp === 'neutral') {
    return surface[500];
  }

  if (data.length < 2) {
    return surface[500];
  }

  const first = data[0];
  const last = data[data.length - 1];

  // Flat: variação menor que 2% em relação ao valor inicial
  const delta = first !== 0 ? Math.abs((last - first) / first) : Math.abs(last - first);
  if (delta < 0.02) {
    return surface[500];
  }

  const isRising = last > first;

  if (semanticProp === 'positive-up') {
    return isRising ? semantic.success[500] : semantic.danger[500];
  }

  // negative-up: subindo é ruim
  return isRising ? semantic.danger[500] : semantic.success[500];
}

export function Sparkline({
  data,
  variant = 'line',
  width = 80,
  height = 28,
  semantic: semanticProp = 'positive-up',
  ariaLabel,
}: SparklineProps) {
  const chartData: DataPoint[] = data.map((v) => ({ v }));
  const color = resolveColor(data, semanticProp);

  const sharedProps = {
    data: chartData,
    margin: { top: 2, right: 2, left: 2, bottom: 2 },
  };

  const lineProps = {
    type: 'monotone' as const,
    dataKey: 'v',
    stroke: color,
    strokeWidth: 1.5,
    dot: false,
    isAnimationActive: false,
  };

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'inline-block', width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'area' ? (
          <AreaChart {...sharedProps}>
            <Area
              {...lineProps}
              fill={color}
              fillOpacity={0.15}
            />
          </AreaChart>
        ) : (
          <LineChart {...sharedProps}>
            <Line {...lineProps} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </span>
  );
}

export default Sparkline;
