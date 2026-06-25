import { Box, Divider, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { content, primary, semantic, surface } from '../../../../theme/tokens';
import { SectionCard } from '../SectionCard';
import type { CoachAthleteRow } from '../../types/CoachInbox';

interface AdherenceTabPanelProps {
  selected: CoachAthleteRow;
}

export function AdherenceTabPanel({ selected }: AdherenceTabPanelProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 0.95fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
      <SectionCard title="Adesão nas últimas semanas">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
          {selected.adherenceTrend.map((value, index) => (
            <Box key={`${selected.id}-adherence-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography sx={{ width: 40, fontSize: '0.64rem', color: surface[400] }}>S{index + 1}</Typography>
              <LinearProgress
                variant="determinate"
                value={value}
                sx={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  bgcolor: `${surface[0]}14`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: value >= 85 ? semantic.success[500] : value >= 70 ? primary[500] : semantic.warning[500],
                    borderRadius: 999,
                  },
                }}
              />
              <Typography sx={{ width: 36, textAlign: 'right', fontSize: '0.64rem', color: surface[200], fontWeight: 700 }}>{value}%</Typography>
            </Box>
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="Notas do treinador">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.5 } }}>
          <Typography sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem', lg: '0.85rem', xl: '0.9rem' }, color: surface[100], lineHeight: 1.45 }}>{selected.notes}</Typography>
          <Divider sx={{ borderColor: content.divider }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selected.suggestedActions.map((action) => (
              <Box key={`${selected.id}-${action}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
                <Typography sx={{ fontSize: '0.84rem', color: surface[200] }}>{action}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>
    </Box>
  );
}
