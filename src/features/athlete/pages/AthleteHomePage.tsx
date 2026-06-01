import { Box, Typography } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec refine-athlete-shell-ux):
//   TodayHeroCard — gradiente dinâmico por workoutType + timeOfDay + CTA contextual
//   ReadinessCard — substitui "Preparação"; escala qualitativa Baixa/Moderada/Alta/Ótima
//   MetricCards   — TSS→"Carga de treino", CTL→"Condicionamento" (com tooltips)
//   QuickCheckInModal — RPE e disposição pré-treino
export default function AthleteHomePage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <HomeIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Hoje
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Seu treino e prontidão do dia
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${surface[700]}`, borderRadius: 1 }}>
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — TodayHeroCard + ReadinessCard + MetricCards + QuickCheckInModal
        </Typography>
      </Box>
    </Box>
  );
}
