import { Box } from '@mui/material';
import { Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { content, primary, surface } from '../../../theme/tokens';

interface TrendCardProps {
  data: number[];
  stroke?: string;
}

export function TrendCard({ data, stroke = primary[500] }: TrendCardProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <Box sx={{ width: '100%', height: 92 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
          <XAxis dataKey="index" hide />
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <RechartsTooltip
            cursor={false}
            contentStyle={{
              backgroundColor: surface[700],
              border: `1px solid ${content.cardBorder}`,
              borderRadius: 8,
              color: surface[50],
              fontSize: '0.75rem',
            }}
            formatter={(value) => [`${value}`, 'Valor']}
            labelFormatter={(label) => `Ponto ${Number(label) + 1}`}
          />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
