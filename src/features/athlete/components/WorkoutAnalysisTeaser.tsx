import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { radius } from '../../../shared/design-tokens/density';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';
import { SparkleIcon } from './WorkoutAnalysisCard';

export interface WorkoutAnalysisTeaserProps {
  view: WorkoutAnalysisView;
  onClick: () => void;
}

/**
 * Entrada compacta para a análise de IA na Home (estilo "Athlete Intelligence" da Strava: ícone de
 * IA + insight de uma linha + seta). Abre `TodayWorkoutAnalysisDrawer` ao ser clicado. Some quando
 * não há nenhum texto para prévia (`empty`/`error` não chegam aqui — ver `AthleteHomePage`).
 */
export function WorkoutAnalysisTeaser({ view, onClick }: WorkoutAnalysisTeaserProps) {
  const pendente = view.status === 'pending';
  const preview = pendente ? 'Analisando o seu treino…' : view.reconhecimento ?? view.comoFoi ?? view.esforco;

  if (!preview) return null;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Ver análise do treino"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: radius.lg,
        cursor: 'pointer',
        bgcolor: alpha(primary[500], 0.08),
        border: `1px solid ${alpha(primary[500], 0.24)}`,
        transition: 'all 0.15s ease',
        '&:hover': { bgcolor: alpha(primary[500], 0.12) },
        '&:focus-visible': { outline: `2px solid ${primary[500]}`, outlineOffset: '1px' },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(primary[500], 0.16),
        }}
      >
        <SparkleIcon />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: surface[50], fontWeight: 700, lineHeight: 1.3 }}>
          Análise do treino
        </Typography>
        <Typography
          variant="body2"
          noWrap
          sx={{ color: surface[300], fontStyle: pendente ? 'italic' : 'normal' }}
        >
          {preview}
        </Typography>
      </Box>

      <ChevronRightIcon sx={{ color: primary[500], flexShrink: 0 }} />
    </Box>
  );
}

export default WorkoutAnalysisTeaser;
