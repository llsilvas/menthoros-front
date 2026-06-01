import { Box, Typography } from '@mui/material';
import { EventNote as PlanIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec refine-athlete-shell-ux):
//   WeeklyPlanList — scroll horizontal com DayCard por dia da semana
//   DayCard — isToday: borda lime + badge "HOJE" + auto-scroll
//              isFuture: opacity 0.6
//   Footer — "Carga da semana" (era "Total TSS") + interpretação qualitativa
export default function AthletePlanPage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PlanIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Plano
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Treinos da semana
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${surface[700]}`, borderRadius: 1 }}>
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — WeeklyPlanList com DayCard (isToday, isFuture) + carga da semana
        </Typography>
      </Box>
    </Box>
  );
}
