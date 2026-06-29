import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { primary, surface, semantic } from '../../../theme/tokens';
import { glassSx } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PMCDataPoint {
  date: Date;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
}

export type PMCRange = '4w' | '8w' | '12w' | '6m' | '1y';

export interface PMCChartProps {
  data: PMCDataPoint[];
  range: PMCRange;
  defaultMode?: 'simple' | 'advanced';
  onRangeChange?: (range: PMCRange) => void;
}

type ViewMode = 'simple' | 'advanced';

// ── Chart tokens ──────────────────────────────────────────────────────────────

const CHART_GRID_STROKE = overlayWhite[8];
const CHART_AXIS_STROKE = surface[400];
const CHART_TOOLTIP_BG = surface[700];
const CHART_TOOLTIP_COLOR = surface[50];

// ── Range labels ──────────────────────────────────────────────────────────────

const RANGE_LABELS: Record<PMCRange, string> = {
  '4w': '4s',
  '8w': '8s',
  '12w': '12s',
  '6m': '6m',
  '1y': '1a',
};

const ALL_RANGES: PMCRange[] = ['4w', '8w', '12w', '6m', '1y'];

// ── Advanced legend translator ────────────────────────────────────────────────

const ADVANCED_LABELS: Record<string, string> = {
  ctl: 'Condicionamento',
  atl: 'Cansaço',
  tsb: 'Forma',
};

function legendFormatter(value: string): string {
  return ADVANCED_LABELS[value] ?? value;
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}

function ToggleButton({ label, active, onClick, small = false }: ToggleButtonProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        px: small ? 1 : 1.5,
        py: small ? 0.25 : 0.5,
        fontSize: small ? '0.72rem' : '0.78rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        border: 'none',
        borderRadius: 1,
        bgcolor: active ? primary[500] : 'transparent',
        color: active ? surface[900] : surface[400],
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: active ? primary[500] : `${primary[500]}1A`,
          color: active ? surface[900] : surface[50],
        },
      }}
    >
      {label}
    </Box>
  );
}

// ── Simple chart (TSS bars) ───────────────────────────────────────────────────

interface SimpleChartProps {
  chartData: Array<{ dateLabel: string; tss: number }>;
}

function SimpleChart({ chartData }: SimpleChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="dateLabel"
          stroke={CHART_AXIS_STROKE}
          tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_AXIS_STROKE}
          tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: 'none',
            borderRadius: 6,
            color: CHART_TOOLTIP_COLOR,
            fontSize: '0.8rem',
          }}
          cursor={{ fill: `${primary[500]}14` }}
        />
        <Bar
          dataKey="tss"
          name="TSS"
          fill={`${primary[500]}66`}
          stroke={primary[500]}
          strokeWidth={1}
          radius={[2, 2, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Advanced chart (CTL / ATL / TSB lines) ────────────────────────────────────

interface AdvancedChartProps {
  chartData: Array<{ dateLabel: string; ctl: number; atl: number; tsb: number }>;
}

function AdvancedChart({ chartData }: AdvancedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="dateLabel"
          stroke={CHART_AXIS_STROKE}
          tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_AXIS_STROKE}
          tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_TOOLTIP_BG,
            border: 'none',
            borderRadius: 6,
            color: CHART_TOOLTIP_COLOR,
            fontSize: '0.8rem',
          }}
          formatter={(value, name) => [
            Number(value).toFixed(1),
            legendFormatter(String(name ?? '')),
          ]}
        />
        <Legend
          wrapperStyle={{ paddingTop: '12px', fontSize: '0.8rem' }}
          formatter={legendFormatter}
        />
        {/* Zero reference line for TSB */}
        <ReferenceLine
          y={0}
          stroke={surface[500]}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Line
          type="monotone"
          dataKey="ctl"
          stroke={semantic.success[500]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="atl"
          stroke={semantic.danger[500]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="tsb"
          stroke={primary[500]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PMCChart({
  data,
  range,
  defaultMode = 'simple',
  onRangeChange,
}: PMCChartProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [internalRange, setInternalRange] = useState<PMCRange>(range);

  function handleRangeChange(r: PMCRange) {
    setInternalRange(r);
    onRangeChange?.(r);
  }

  // Shared chart data with formatted date labels
  const chartData = data.map((pt) => ({
    dateLabel: formatDate(pt.date),
    tss: pt.tss,
    ctl: pt.ctl,
    atl: pt.atl,
    tsb: pt.tsb,
  }));

  return (
    <Box
      sx={{
        ...glassSx,
        borderRadius: 2,
        p: 2.5,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        {/* Title */}
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: surface[50],
            flex: 1,
            minWidth: '120px',
          }}
        >
          Desempenho
        </Typography>

        {/* Mode toggle */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: `${surface[0]}0A`,
            borderRadius: 1,
            p: 0.25,
            gap: 0.25,
          }}
        >
          <ToggleButton
            label="Simples"
            active={mode === 'simple'}
            onClick={() => setMode('simple')}
          />
          <ToggleButton
            label="Avançado"
            active={mode === 'advanced'}
            onClick={() => setMode('advanced')}
          />
        </Box>

        {/* Range chips */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: `${surface[0]}0A`,
            borderRadius: 1,
            p: 0.25,
            gap: 0.25,
          }}
        >
          {ALL_RANGES.map((r) => (
            <ToggleButton
              key={r}
              label={RANGE_LABELS[r]}
              active={internalRange === r}
              onClick={() => handleRangeChange(r)}
              small
            />
          ))}
        </Box>
      </Box>

      {/* Sub-label */}
      <Typography
        sx={{
          fontSize: '0.75rem',
          color: surface[500],
          mb: 1.5,
        }}
      >
        {mode === 'simple'
          ? 'Carga de treino diária (TSS)'
          : 'Condicionamento · Cansaço · Forma'}
      </Typography>

      {/* Chart */}
      {mode === 'simple' ? (
        <SimpleChart chartData={chartData} />
      ) : (
        <AdvancedChart chartData={chartData} />
      )}
    </Box>
  );
}

export default PMCChart;
