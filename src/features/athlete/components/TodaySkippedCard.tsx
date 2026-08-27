import { Box, Button, Typography } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { surface, primary } from '../../../theme/tokens';
import type { MotivoPulo } from '../../../types/AthleteWorkoutToday';

const MOTIVO_LABELS: Record<MotivoPulo, string> = {
  SEM_TEMPO: 'sem tempo', CANSADO: 'cansaço', DOR: 'dor', OUTRO: 'outro motivo',
};

export interface TodaySkippedCardProps {
  motivoPulo?: string;
  onRegister: () => void;
}

/** Hero quando o atleta pulou o treino de hoje (D1, estado PULADO). */
export function TodaySkippedCard({ motivoPulo, onRegister }: TodaySkippedCardProps) {
  const label = motivoPulo && motivoPulo in MOTIVO_LABELS ? MOTIVO_LABELS[motivoPulo as MotivoPulo] : null;

  return (
    <Box
      sx={{
        bgcolor: elevation.panel, border: `1px solid ${surface[700]}`, borderRadius: radius.lg,
        p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
      }}
    >
      <Typography variant="h4">Hoje você pulou</Typography>
      <Typography variant="body2" sx={{ color: surface[400] }}>
        {label ? `Motivo: ${label}. Seu coach vê isso no plano da semana.` : 'Seu coach vê isso no plano da semana.'}
      </Typography>
      <Button
        variant="outlined" onClick={onRegister}
        sx={{ borderColor: primary[500], color: primary[400], minHeight: 44, fontWeight: 700 }}
      >
        Registrar mesmo assim
      </Button>
    </Box>
  );
}

export default TodaySkippedCard;
