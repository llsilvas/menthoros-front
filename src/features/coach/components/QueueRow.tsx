import { memo } from 'react';
import { Box, ButtonBase, Chip, LinearProgress, Typography } from '@mui/material';
import { content, primary, semantic, surface } from '../../../theme/tokens';
import type { CoachAthleteRow } from '../types/CoachInbox';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import { formatPercent, paletteForDecision } from './coachInboxHelpers';

interface QueueRowProps {
  athlete: CoachAthleteRow;
  selected: boolean;
  onClick: () => void;
}

export const QueueRow = memo(function QueueRow({ athlete, selected, onClick }: QueueRowProps) {
  const decision = paletteForDecision(athlete.decision);

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'block',
        borderRadius: 1.5,
        border: `1px solid ${selected ? primary[500] : content.cardBorder}`,
        backgroundColor: selected ? `${primary[500]}10` : `${surface[0]}06`,
        px: { xs: 1, sm: 1.1, xl: 1.35 },
        py: { xs: 0.82, sm: 0.9, xl: 1.15 },
        transition: 'background-color 150ms ease, border-color 150ms ease',
        '&:hover': {
          backgroundColor: selected ? `${primary[500]}14` : `${surface[0]}10`,
          borderColor: primary[500],
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 0.85, sm: 1, xl: 1.3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.7, sm: 0.85, xl: 1.05 }, minWidth: 0 }}>
          <CoachAthleteAvatar
            athlete={{ id: athlete.id, name: athlete.name }}
            size="xs"
            status={athlete.segment === 'drop' ? 'alert' : athlete.segment === 'attention' ? 'warning' : 'synced'}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem', xl: '0.86rem' }, fontWeight: 700, color: surface[50], lineHeight: 1.15 }} noWrap>
              {athlete.name}
            </Typography>
            <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.72rem', color: surface[400] }} noWrap>
              {athlete.discipline} · {athlete.weeksOnPlan} semanas
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
          <Chip
            size="small"
            label={athlete.statusLabel}
            sx={{
              height: { xs: 20, xl: 24 },
              fontSize: { xs: '0.6rem', sm: '0.62rem', xl: '0.68rem' },
              fontWeight: 700,
              color: decision.fg,
              bgcolor: decision.bg,
              border: `1px solid ${decision.border}`,
              '& .MuiChip-label': { px: { xs: 0.7, sm: 0.8, xl: 1 } },
            }}
          />
          <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.66rem', xl: '0.72rem' }, color: surface[400] }}>
            {formatPercent(athlete.adherence)}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mt: { xs: 0.7, sm: 0.8, xl: 1.05 } }}>
        <LinearProgress
          variant="determinate"
          value={athlete.adherence}
          sx={{
            height: { xs: 4, sm: 5, xl: 7 },
            borderRadius: 999,
            bgcolor: `${surface[0]}14`,
            '& .MuiLinearProgress-bar': {
              bgcolor: athlete.adherence >= 85 ? semantic.success[500] : athlete.adherence >= 70 ? primary[500] : semantic.warning[500],
              borderRadius: 999,
            },
          }}
        />
      </Box>
      <Box sx={{ mt: 0.85, display: { xs: 'none', xl: 'flex' }, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', color: surface[300], lineHeight: 1.3 }}>
          Próximo: {athlete.nextWorkout.title}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: surface[500] }}>
          {athlete.delay > 0 ? `${athlete.delay} treino${athlete.delay > 1 ? 's' : ''}` : '0 atraso'}
        </Typography>
      </Box>
    </ButtonBase>
  );
});
