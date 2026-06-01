import { Box, Typography } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec standardize-coach-shell-ux):
//   Header: filtro inteligente "Em foco" (default) + navegador de semana + ações
//   Body: grid de calendário
//     Coluna esquerda: AthleteRow.calendar × N (limitado pelo filtro)
//     Colunas: seg-dom com WorkoutBlock × N por célula
//   Virtualização com react-window para listas longas (24+ atletas)
export default function CoachCalendarPage() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        gap: 2,
        bgcolor: elevation.base,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CalendarIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Calendário
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Visão semanal com filtro inteligente — atletas em foco
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px dashed ${surface[700]}`,
          borderRadius: 1,
        }}
      >
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — grid semanal com filtro inteligente e drag-to-reschedule
        </Typography>
      </Box>
    </Box>
  );
}
