import { Box, Chip, Typography } from '@mui/material';
import { content, surface } from '../../../theme/tokens';
import type { CoachAtletaResumo } from '../../../types/Coach';
import { statusLabel, statusPalette } from './coachInboxHelpers';

interface DashboardRosterPreviewRowProps {
  athlete: CoachAtletaResumo;
}

export function DashboardRosterPreviewRow({ athlete }: DashboardRosterPreviewRowProps) {
  const palette = statusPalette(athlete.status);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 0.85, xl: 1.25 },
        px: { xs: 0.85, xl: 1 },
        py: { xs: 0.75, xl: 0.9 },
        borderRadius: 1,
        border: `1px solid ${content.cardBorder}`,
        backgroundColor: `${surface[0]}06`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: { xs: '0.78rem', xl: '0.82rem' }, fontWeight: 700, color: surface[50], lineHeight: 1.2 }} noWrap>
          {athlete.nome}
        </Typography>
        <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.72rem', color: surface[400] }} noWrap>
          {athlete.fase ?? 'Sem fase'} · {athlete.weeklyVolume.toFixed(1)} km
        </Typography>
      </Box>
      <Chip
        size="small"
        label={statusLabel(athlete.status)}
        sx={{
          height: { xs: 20, xl: 24 },
          fontSize: { xs: '0.62rem', xl: '0.68rem' },
          fontWeight: 700,
          color: palette.fg,
          bgcolor: palette.bg,
          border: `1px solid ${palette.border}`,
          '& .MuiChip-label': { px: { xs: 0.75, xl: 1 } },
        }}
      />
    </Box>
  );
}
