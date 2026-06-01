import { Box, Typography } from '@mui/material';
import { Insights as InsightsIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec standardize-coach-shell-ux):
//   Tabs: Visão geral | Carga | Performance | Saúde | Comparativos
//   Visão geral: KPICard grid + alertas + top atletas por TSS
//   Carga: distribuição de carga, monotonia, strain agregado
//   Performance: evolução VO2max, PRs, simulações de prova
//   Saúde: lesões reportadas, sinais de overreaching
//   Comparativos: grupos de atletas (maratonistas vs 10k)
export default function CoachInsightsPage() {
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
        <InsightsIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Insights
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Analytics da assessoria — carga, performance e saúde do time
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
          Em construção — KPICards + gráficos em 5 tabs (Visão geral, Carga, Performance, Saúde, Comparativos)
        </Typography>
      </Box>
    </Box>
  );
}
