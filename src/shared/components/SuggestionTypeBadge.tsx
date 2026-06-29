import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { categorical, semantic, surface } from '../../shared/design-tokens';

export type SuggestionType =
  | 'new_plan'
  | 'plan_adjust'
  | 'recovery'
  | 'race_simulation'
  | 'deload'
  | 'injury_response';

export interface SuggestionTypeBadgeProps {
  type: SuggestionType;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft' | 'outline';
}

interface SuggestionConfig {
  label: string;
  color: string;
}

const suggestionConfig: Record<SuggestionType, SuggestionConfig> = {
  new_plan:        { label: 'Novo plano',      color: categorical.cat1 },
  plan_adjust:     { label: 'Ajuste de plano', color: categorical.cat3 },
  recovery:        { label: 'Recuperação',     color: categorical.cat7 },
  race_simulation: { label: 'Simulação de prova', color: categorical.cat6 },
  deload:          { label: 'Descarga',        color: categorical.cat8 },
  injury_response: { label: 'Resposta a lesão', color: semantic.danger[300] },
};

const sizeStyles: Record<
  NonNullable<SuggestionTypeBadgeProps['size']>,
  { fontSize: string; height: number }
> = {
  sm: { fontSize: '0.7rem', height: 20 },
  md: { fontSize: '0.8rem', height: 24 },
};

export function SuggestionTypeBadge({
  type,
  size = 'sm',
  variant = 'soft',
}: SuggestionTypeBadgeProps) {
  const config = suggestionConfig[type];
  const { fontSize, height } = sizeStyles[size];

  const bgColor: string =
    variant === 'solid'
      ? config.color
      : variant === 'soft'
      ? alpha(config.color, 0.15)
      : 'transparent';

  const textColor: string =
    variant === 'solid' ? surface[50] : config.color;

  const border: string | undefined =
    variant === 'outline' ? `1px solid ${config.color}` : undefined;

  return (
    <Box
      component="span"
      sx={{
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        height,
        px:              0.75,
        borderRadius:    '999px',
        backgroundColor: bgColor,
        border,
        boxSizing:       'border-box',
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize,
          fontWeight: 500,
          lineHeight: 1,
          color:      textColor,
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
}

export default SuggestionTypeBadge;
