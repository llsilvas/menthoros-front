import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { zones } from '../../../theme/tokens';
import { semantic, surface } from '../../../theme/tokens';
import { glassSx } from '../../../theme/tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface ZoneInsight {
  type: 'positive' | 'neutral' | 'warning';
  message: string;
  relatedPhase?: 'BASE' | 'BUILD' | 'ESPECIFICO' | 'TAPER';
}

export interface ZoneDistributionInsightProps {
  distribution: ZoneDistribution;
  totalDuration: number; // segundos
  periodLabel: string;
  insight: ZoneInsight;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ZONE_KEYS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const;
type ZoneKey = typeof ZONE_KEYS[number];

const DIST_KEYS: Record<ZoneKey, keyof ZoneDistribution> = {
  Z1: 'z1',
  Z2: 'z2',
  Z3: 'z3',
  Z4: 'z4',
  Z5: 'z5',
};

const INSIGHT_CONFIG = {
  positive: {
    icon: '✓',
    color: semantic.success[500],
    bg: `${semantic.success[500]}0D`,
  },
  neutral: {
    icon: 'ℹ',
    color: semantic.info[500],
    bg: `${semantic.info[500]}0D`,
  },
  warning: {
    icon: '⚠',
    color: semantic.warning[500],
    bg: `${semantic.warning[500]}0D`,
  },
} as const;

const CHART_TOOLTIP_BG = surface[700];
const CHART_TOOLTIP_COLOR = surface[50];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMinutes(pct: number, totalDurationSec: number): number {
  return Math.round((pct / 100) * totalDurationSec / 60);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ZoneLegendRowProps {
  zoneKey: ZoneKey;
  pct: number;
  totalDuration: number;
}

function ZoneLegendRow({ zoneKey, pct, totalDuration }: ZoneLegendRowProps) {
  const zone = zones[zoneKey];
  const mins = formatMinutes(pct, totalDuration);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.25,
      }}
    >
      {/* Color swatch */}
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '2px',
          bgcolor: zone.color,
          flexShrink: 0,
        }}
      />
      {/* Label */}
      <Typography
        sx={{
          fontSize: '0.78rem',
          color: surface[400],
          flex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {zoneKey} {zone.label}
      </Typography>
      {/* Percentage */}
      <Typography
        sx={{
          fontSize: '0.78rem',
          color: surface[50],
          fontWeight: 600,
          minWidth: '32px',
          textAlign: 'right',
        }}
      >
        {pct}%
      </Typography>
      {/* Minutes */}
      <Typography
        sx={{
          fontSize: '0.75rem',
          color: surface[500],
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {mins} min
      </Typography>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ZoneDistributionInsight({
  distribution,
  totalDuration,
  periodLabel,
  insight,
}: ZoneDistributionInsightProps) {
  const insightCfg = INSIGHT_CONFIG[insight.type];

  const chartData = ZONE_KEYS.map((zk) => ({
    name: `${zk} ${zones[zk].label}`,
    value: distribution[DIST_KEYS[zk]],
    color: zones[zk].color,
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
      <Typography
        sx={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: surface[50],
          mb: 2,
        }}
      >
        Distribuição de Zonas &middot; {periodLabel}
      </Typography>

      {/* Chart + legend row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Donut chart */}
        <Box sx={{ flexShrink: 0, width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                isAnimationActive={false}
                strokeWidth={1}
                stroke={surface[800]}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: CHART_TOOLTIP_BG,
                  border: 'none',
                  borderRadius: 6,
                  color: CHART_TOOLTIP_COLOR,
                  fontSize: '0.8rem',
                }}
                formatter={(value) => [`${value}%`, ''] as [string, string]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Custom legend */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {ZONE_KEYS.map((zk) => (
            <ZoneLegendRow
              key={zk}
              zoneKey={zk}
              pct={distribution[DIST_KEYS[zk]]}
              totalDuration={totalDuration}
            />
          ))}
        </Box>
      </Box>

      {/* Insight card */}
      <Box
        sx={{
          mt: 2,
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          bgcolor: insightCfg.bg,
          border: `1px solid ${insightCfg.color}26`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: '0.9rem',
            color: insightCfg.color,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          {insightCfg.icon}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.82rem',
            color: surface[200],
            lineHeight: 1.5,
          }}
        >
          {insight.message}
          {insight.relatedPhase && (
            <Box
              component="span"
              sx={{ color: insightCfg.color, fontWeight: 600, ml: 0.5 }}
            >
              ({insight.relatedPhase})
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
}

export default ZoneDistributionInsight;
