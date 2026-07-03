import { Box, Typography } from '@mui/material';
import { ChatBubbleOutline as ChatIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

/**
 * Mensageria coach↔atleta ainda não existe no backend (change-fonte:
 * `add-athlete-coach-messaging`, Sprint 25). Até lá, exibimos um placeholder honesto —
 * sem simular conversa nem coach fake (ver `wire-athlete-shell-to-endpoints` CA3).
 */
export default function AthleteCoachPage() {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        bgcolor: elevation.base,
        px: 4,
        py: 8,
      }}
    >
      <ChatIcon sx={{ color: primary[500], fontSize: 48, opacity: 0.9 }} />
      <Typography sx={{ color: surface[50], fontWeight: 700, fontSize: '1.05rem' }}>
        Mensagens chegam em breve
      </Typography>
      <Typography variant="body2" sx={{ color: surface[400], maxWidth: 320 }}>
        A conversa direta com o seu coach está a caminho. Enquanto isso, seu plano e progresso
        já refletem as decisões dele.
      </Typography>
    </Box>
  );
}
