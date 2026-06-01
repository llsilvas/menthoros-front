import { Box, Typography } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec standardize-coach-shell-ux):
//   Col 1: Filtros (~80px)
//   Col 2: Lista de sugestões (~360px, AthleteRow.list + ConfidenceBar)
//   Col 3: Painel de revisão (flex-1, PlanDiffView + tabs)
export default function CoachInboxPage() {
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
        <InboxIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Inbox
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Validações pendentes da IA
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
          Em construção — split-view: filtros | lista | painel de revisão
        </Typography>
      </Box>
    </Box>
  );
}
