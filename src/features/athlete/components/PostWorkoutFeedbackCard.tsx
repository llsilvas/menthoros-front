import { Box, Button, Typography } from '@mui/material';
import { surface, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { buildPostWorkoutFeedback } from '../adapters/postWorkoutFeedbackAdapter';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

export interface PostWorkoutFeedbackCardProps {
  treino: TreinoRealizadoDto;
  onVoltar: () => void;
}

export function PostWorkoutFeedbackCard({ treino, onVoltar }: PostWorkoutFeedbackCardProps) {
  const { tipoLabel, duracaoLabel, distanciaLabel, tssLabel, mensagem } = buildPostWorkoutFeedback(treino);

  return (
    <Box
      sx={{
        bgcolor: elevation.card,
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: surface[50] }}>
        {tipoLabel}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {duracaoLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{duracaoLabel}</Typography>
        )}
        {distanciaLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{distanciaLabel}</Typography>
        )}
        {tssLabel && (
          <Typography sx={{ color: surface[200], fontSize: '0.9rem', fontWeight: 600 }}>{tssLabel}</Typography>
        )}
      </Box>

      <Typography sx={{ color: surface[400], fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.4 }}>
        {mensagem}
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={onVoltar}
        sx={{ bgcolor: primary[500], color: elevation.base, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
      >
        Voltar para Home
      </Button>
    </Box>
  );
}

export default PostWorkoutFeedbackCard;
