import { Button } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import { Link as RouterLink } from 'react-router';
import { athleteShareWorkoutRoute } from '../../../../constants/routes';

export interface ShareWorkoutButtonProps {
  treinoRealizadoId: string;
  onClick?: () => void;
}

/** Entrada para a tela de compartilhar um treino realizado. */
export function ShareWorkoutButton({ treinoRealizadoId, onClick }: ShareWorkoutButtonProps) {
  return (
    <Button
      component={RouterLink}
      to={athleteShareWorkoutRoute(treinoRealizadoId)}
      onClick={onClick}
      variant="outlined"
      fullWidth
      startIcon={<IosShareIcon />}
      sx={{ minHeight: 44 }}
    >
      Compartilhar
    </Button>
  );
}
