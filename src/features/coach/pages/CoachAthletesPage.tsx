import { Box, Typography } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec standardize-coach-shell-ux):
//   Header: filtros + views + bulk actions
//   Body: tabela virtualizada com AthleteRow.table (@tanstack/react-table + react-virtual)
//   Hover: HoverCard com mini-dashboard do atleta
export default function CoachAthletesPage() {
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
        <PeopleIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Atletas
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Visão geral do time com métricas de carga
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
          Em construção — tabela virtualizada com CTL/ATL/TSB e filter chips
        </Typography>
      </Box>
    </Box>
  );
}
