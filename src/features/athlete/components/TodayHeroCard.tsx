import { Box, Button, Link, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router';
import { Add as AddIcon } from '@mui/icons-material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { primary, surface } from '../../../theme/tokens';
import { ROUTES } from '../../../constants/routes';

export interface TodayHeroCardProps {
  nextWorkout: {
    title: string;
    description: string;
    estimatedDuration?: number; // minutos; ausente quando o resumo do dia não traz duração
    /** Cor do tipo de treino (fonte única `workoutTypeColor()`, enum do backend). */
    color?: string;
  } | null;
  /** Única ação primária da Home: registrar o treino de hoje. */
  onRegister: () => void;
}

/**
 * Hero da Home: o treino de hoje é o objeto, com uma ação (D1). A saudação foi para o cabeçalho
 * da página e a frase motivacional fixa saiu — ocupava o lugar mais nobre da tela sem dado.
 */
export function TodayHeroCard({ nextWorkout, onRegister }: TodayHeroCardProps) {
  const cor = nextWorkout?.color ?? surface[500];

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${elevation.panel} 0%, ${elevation.card} 100%)`,
        border: `1px solid ${surface[700]}`,
        borderRadius: radius.lg,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="overline" sx={{ color: surface[400] }}>Treino de hoje</Typography>
        {nextWorkout && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: radius.full, border: `1px solid ${alpha(cor, 0.45)}`, bgcolor: alpha(cor, 0.18) }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cor }} />
            <Typography variant="caption" sx={{ color: surface[300], fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {nextWorkout.title}
            </Typography>
          </Box>
        )}
      </Box>

      <Box data-testid="home-next-workout" sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="h3">
          {nextWorkout ? nextWorkout.title : 'Descanso'}
        </Typography>
        <Typography variant="body1" sx={{ color: surface[300] }}>
          {nextWorkout
            ? `${nextWorkout.description}${nextWorkout.estimatedDuration != null ? ` · ${nextWorkout.estimatedDuration} min` : ''}`
            : 'Sem treino planejado. Se fizer algo, registre — conta na semana.'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onRegister}
          sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 48, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
        >
          Registrar treino
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Link component={RouterLink} to={ROUTES.ATHLETE_PLAN} variant="body2" underline="hover" sx={{ color: surface[400], py: 0.75 }}>
            Ver plano da semana →
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export default TodayHeroCard;
