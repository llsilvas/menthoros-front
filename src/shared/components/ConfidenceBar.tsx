import { Box, Typography } from '@mui/material';
import { primary, semantic, surface } from '../../theme/tokens';

export interface ConfidenceBarProps {
  value: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ConfidenceTier {
  color: string;
  label: string;
}

const HEIGHT_MAP: Record<NonNullable<ConfidenceBarProps['size']>, number> = {
  sm: 4,
  md: 6,
  lg: 8,
};

function resolveTier(value: number): ConfidenceTier {
  if (value >= 90) {
    return { color: semantic.success[500], label: 'Confiança muito alta' };
  }
  if (value >= 75) {
    return { color: primary[500], label: 'Alta confiança' };
  }
  if (value >= 50) {
    return { color: semantic.warning[500], label: 'Confiança moderada' };
  }
  return { color: semantic.danger[500], label: 'Baixa confiança' };
}

export function ConfidenceBar({
  value,
  showLabel = true,
  showPercentage = true,
  size = 'md',
}: ConfidenceBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const tier = resolveTier(clamped);
  const height = HEIGHT_MAP[size];
  const isCompact = size === 'sm';

  return (
    <Box sx={{ width: '100%' }}>
      {(showLabel || showPercentage) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: isCompact ? 0.25 : 0.5,
          }}
        >
          {showLabel && (
            <Typography
              variant="caption"
              sx={{
                color: tier.color,
                fontWeight: 500,
                fontSize: isCompact ? '0.65rem' : '0.75rem',
                lineHeight: 1,
              }}
            >
              {tier.label}
            </Typography>
          )}
          {showPercentage && (
            <Typography
              variant="caption"
              sx={{
                color: surface[400],
                fontWeight: 400,
                fontSize: isCompact ? '0.65rem' : '0.75rem',
                lineHeight: 1,
                ml: showLabel ? 0.5 : 'auto',
              }}
            >
              {clamped}%
            </Typography>
          )}
        </Box>
      )}

      {/* Track */}
      <Box
        sx={{
          width: '100%',
          height,
          borderRadius: 999,
          backgroundColor: surface[700],
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <Box
          sx={{
            width: `${clamped}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: tier.color,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
    </Box>
  );
}

export default ConfidenceBar;
