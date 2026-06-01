import { Box, Typography } from '@mui/material';
import { Forum as CoachIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// Layout previsto (spec refine-athlete-shell-ux):
//   CoachChatPanel — lista de mensagens estilo WhatsApp
//   MessageBubble  — variants: texto | áudio (com player + transcrição Whisper) | ajuste-de-plano
//   AudioRecorder  — gravação de voz com feedback visual (waveform)
//   PlanAdjustmentCard — notificação inline de ajustes feitos pelo coach
//   Realtime via WebSocket/SSE (alinhar com backend)
export default function AthleteCoachPage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CoachIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Coach
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Comunicação com seu treinador
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${surface[700]}`, borderRadius: 1 }}>
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — CoachChatPanel + MessageBubble + AudioRecorder + PlanAdjustmentCard
        </Typography>
      </Box>
    </Box>
  );
}
