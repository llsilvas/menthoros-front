import { Box, Chip, Typography } from '@mui/material';
import { content, semantic, surface } from '../../../theme/tokens';
import type { CoachAttentionItem } from '../../../types/Coach';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';

const ATTENTION_SEVERITY_LABEL: Record<CoachAttentionItem['severity'], string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
};

const ATTENTION_REASON_LABEL: Record<CoachAttentionItem['primaryReason'], string> = {
  FADIGA: 'Fadiga',
  SOBRECARGA: 'Sobrecarga',
  SEM_PLANO: 'Sem plano',
  ADERENCIA: 'Aderência',
  INATIVIDADE: 'Inatividade',
  ZONAS_VENCIDAS: 'Zonas vencidas',
};

interface DashboardAttentionQueueRowProps {
  item: CoachAttentionItem;
}

export function DashboardAttentionQueueRow({ item }: DashboardAttentionQueueRowProps) {
  const severityColor =
    item.severity === 'CRITICA' ? semantic.danger[500] : item.severity === 'ALTA' ? semantic.warning[500] : semantic.info[500];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 0.55, xl: 0.8 },
        px: { xs: 0.85, xl: 1 },
        py: { xs: 0.75, xl: 0.9 },
        borderRadius: 1,
        border: `1px solid ${content.cardBorder}`,
        backgroundColor: `${surface[0]}06`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, xl: 1 }, minWidth: 0 }}>
          <CoachAthleteAvatar athlete={{ id: item.atletaId, name: item.athleteName }} size="xs" status="warning" />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: '0.78rem', xl: '0.82rem' }, fontWeight: 700, color: surface[50], lineHeight: 1.15 }} noWrap>
              {item.athleteName}
            </Typography>
            <Typography sx={{ fontSize: { xs: '0.66rem', xl: '0.72rem' }, color: surface[400] }} noWrap>
              {ATTENTION_REASON_LABEL[item.primaryReason]}
            </Typography>
          </Box>
        </Box>
        <Chip
          size="small"
          label={ATTENTION_SEVERITY_LABEL[item.severity]}
          sx={{
            height: { xs: 20, xl: 24 },
            fontSize: { xs: '0.62rem', xl: '0.68rem' },
            fontWeight: 700,
            color: severityColor,
            bgcolor: `${severityColor}14`,
            border: `1px solid ${severityColor}44`,
            '& .MuiChip-label': { px: { xs: 0.75, xl: 1 } },
          }}
        />
      </Box>
      <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.76rem', color: surface[200], lineHeight: 1.45 }}>
        {item.suggestedAction}
      </Typography>
    </Box>
  );
}
