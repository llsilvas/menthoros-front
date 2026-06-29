import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { primary, semantic, surface } from '../../shared/design-tokens';

export type TrainingPhase = 'BASE' | 'BUILD' | 'ESPECIFICO' | 'TAPER' | 'RECOVERY';

export interface PhaseIndicatorProps {
  phase: TrainingPhase;
  variant?: 'pill' | 'dot' | 'icon-only';
  showLabel?: boolean;
}

interface PhaseConfig {
  color: string;
  label: string;
}

const phaseConfig: Record<TrainingPhase, PhaseConfig> = {
  BASE:       { color: semantic.info[500],     label: 'Base'        },
  BUILD:      { color: semantic.warning[500],  label: 'Construção'  },
  ESPECIFICO: { color: primary[500],           label: 'Específico'  },
  TAPER:      { color: semantic.success[500],  label: 'Polimento'   },
  RECOVERY:   { color: surface[400],           label: 'Recuperação' },
};

export function PhaseIndicator({
  phase,
  variant = 'pill',
  showLabel,
}: PhaseIndicatorProps) {
  const config = phaseConfig[phase];
  const resolvedShowLabel = showLabel ?? (variant === 'pill');

  if (variant === 'dot' || variant === 'icon-only') {
    return (
      <Box
        component="span"
        sx={{
          display:       'inline-block',
          width:         8,
          height:        8,
          borderRadius:  '50%',
          backgroundColor: config.color,
          flexShrink:    0,
        }}
        aria-label={resolvedShowLabel ? undefined : config.label}
        title={config.label}
      />
    );
  }

  // pill variant
  return (
    <Box
      component="span"
      sx={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             0.5,
        borderRadius:    '999px',
        px:              1,
        py:              0.25,
        backgroundColor: alpha(config.color, 0.15),
      }}
    >
      {resolvedShowLabel && (
        <Typography
          component="span"
          sx={{
            fontSize:   '0.7rem',
            lineHeight: 1.4,
            fontWeight: 500,
            color:      config.color,
            whiteSpace: 'nowrap',
          }}
        >
          {config.label}
        </Typography>
      )}
    </Box>
  );
}

export default PhaseIndicator;
