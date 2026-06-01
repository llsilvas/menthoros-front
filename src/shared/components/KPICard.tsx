import { Box, Skeleton, Tooltip } from '@mui/material';
import { elevation } from '../design-tokens/elevation';
import { surface } from '../design-tokens/colors';
import { content } from '../../theme/tokens';
import { MetricCell } from './MetricCell';
import type { MetricCellProps } from './MetricCell';
import { Sparkline } from './Sparkline';

// ── Types ──────────────────────────────────────────────────────────────────────

type DeltaProps = NonNullable<MetricCellProps['delta']>;

interface SparklineConfig {
  data: number[];
  semantic?: 'positive-up' | 'negative-up' | 'neutral';
}

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: DeltaProps;
  sparkline?: SparklineConfig;
  tooltip?: string;
  emphasis?: 'normal' | 'hero';
  loading?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const VALUE_FONT_SIZE: Record<NonNullable<KPICardProps['emphasis']>, string> = {
  normal: '1.5rem',
  hero:   '2.5rem',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function KPICard({
  label,
  value,
  unit,
  delta,
  sparkline,
  tooltip,
  emphasis = 'normal',
  loading = false,
}: KPICardProps) {
  const isHero   = emphasis === 'hero';
  const padding  = isHero ? 3 : 2;
  const valueFontSize = VALUE_FONT_SIZE[emphasis];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: elevation.card,
          border: `1px solid ${content.cardBorder}`,
          borderRadius: 1,
          p: padding,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: `${surface[700]}80` }} />
          {sparkline && (
            <Skeleton variant="rectangular" width={80} height={28} sx={{ bgcolor: `${surface[700]}80`, borderRadius: 0.5 }} />
          )}
        </Box>
        <Skeleton variant="text" width={isHero ? 140 : 100} height={isHero ? 48 : 32} sx={{ bgcolor: `${surface[700]}80` }} />
        {delta && (
          <Skeleton variant="text" width={60} height={14} sx={{ bgcolor: `${surface[700]}80` }} />
        )}
      </Box>
    );
  }

  // ── Label (with optional Tooltip) ─────────────────────────────────────────
  const labelNode = (
    <Box
      component="span"
      sx={{
        color: surface[400],
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.2,
        cursor: tooltip ? 'help' : 'default',
      }}
    >
      {label}
    </Box>
  );

  const labelWithTooltip = tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      {/* Tooltip requires a single forwardRef child — wrap in span */}
      <span style={{ display: 'inline-flex' }}>{labelNode}</span>
    </Tooltip>
  ) : labelNode;

  // ── Main card ──────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        backgroundColor: elevation.card,
        border: `1px solid ${content.cardBorder}`,
        borderRadius: 1,
        p: padding,
        display: 'flex',
        flexDirection: 'column',
        gap: isHero ? 1.5 : 1,
      }}
    >
      {/* Top row: label + sparkline */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {labelWithTooltip}

        {sparkline && sparkline.data.length > 0 && (
          <Box sx={{ flexShrink: 0, ml: 1 }}>
            <Sparkline
              data={sparkline.data}
              semantic={sparkline.semantic ?? 'positive-up'}
              width={80}
              height={28}
              ariaLabel={`sparkline para ${label}`}
            />
          </Box>
        )}
      </Box>

      {/* Value + unit + delta */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: isHero ? 'center' : 'flex-start',
        }}
      >
        {/* Value row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: valueFontSize,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
              color: surface[50],
            }}
          >
            {value}
          </Box>
          {unit && (
            <Box
              component="span"
              sx={{
                fontSize: '0.85rem',
                color: surface[500],
                lineHeight: 1.1,
              }}
            >
              {unit}
            </Box>
          )}
        </Box>

        {/* Delta row — delegated to MetricCell for consistency */}
        {delta && (
          <MetricCell
            value=""
            delta={delta}
            size="sm"
            align={isHero ? 'center' : 'left'}
          />
        )}
      </Box>
    </Box>
  );
}

export default KPICard;
