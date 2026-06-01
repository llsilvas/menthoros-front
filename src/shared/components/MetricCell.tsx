import { Box, Tooltip } from '@mui/material';
import { semantic, surface } from '../../theme/tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeltaProps {
  direction: 'up' | 'down' | 'flat';
  /** Display label, e.g. "+3" or "+12%" */
  label: string;
  /**
   * Semantic polarity: true = this direction is good news.
   * Examples:
   *  - Running pace down (faster) → isPositive: true
   *  - ATL rising during taper    → isPositive: false
   */
  isPositive: boolean;
}

export interface MetricCellProps {
  value: string | number;
  unit?: string;
  delta?: DeltaProps;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'center';
  tooltip?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE_VALUE: Record<NonNullable<MetricCellProps['size']>, string> = {
  sm: '0.75rem',
  md: '0.9rem',
  lg: '1.1rem',
};

const SIZE_DELTA: Record<NonNullable<MetricCellProps['size']>, string> = {
  sm: '0.65rem',
  md: '0.75rem',
  lg: '0.85rem',
};

// ── Delta helpers ─────────────────────────────────────────────────────────────

function getDeltaColor(direction: DeltaProps['direction'], isPositive: boolean): string {
  if (direction === 'flat') return surface[500];
  // Both 'up' and 'down' obey the same isPositive rule:
  // positive → success colour, negative → danger colour
  return isPositive ? semantic.success[500] : semantic.danger[500];
}

function getDeltaIcon(direction: DeltaProps['direction']): string {
  if (direction === 'up')   return '↑';
  if (direction === 'down') return '↓';
  return '→';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MetricCell({
  value,
  unit,
  delta,
  size = 'md',
  align = 'left',
  tooltip,
}: MetricCellProps) {
  const valueFontSize = SIZE_VALUE[size];
  const deltaFontSize = SIZE_DELTA[size];

  const root = (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems:
          align === 'center' ? 'center'
          : align === 'right' ? 'flex-end'
          : 'flex-start',
        gap: '2px',
        cursor: tooltip ? 'help' : 'default',
      }}
    >
      {/* Value row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '3px',
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: valueFontSize,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
            color: surface[50],
          }}
        >
          {value}
        </Box>
        {unit && (
          <Box
            component="span"
            sx={{
              fontSize: `calc(${valueFontSize} * 0.85)`,
              color: surface[400],
              lineHeight: 1.2,
            }}
          >
            {unit}
          </Box>
        )}
      </Box>

      {/* Delta row */}
      {delta && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: deltaFontSize,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            color: getDeltaColor(delta.direction, delta.isPositive),
          }}
        >
          <span aria-hidden="true">{getDeltaIcon(delta.direction)}</span>
          <span>{delta.label}</span>
        </Box>
      )}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {/* Tooltip requires a single forwardRef child — wrap in span */}
        <span style={{ display: 'inline-flex' }}>{root}</span>
      </Tooltip>
    );
  }

  return root;
}

export default MetricCell;
