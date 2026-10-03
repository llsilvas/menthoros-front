import { Button, Typography } from '@mui/material';
import { surface, primary } from '../../../theme/tokens';
import { Card } from '../../../shared/components/Card';
import { MOTIVO_PULO_LABELS, type MotivoPulo } from '../../../types/AthleteWorkoutToday';

export interface TodaySkippedCardProps {
  motivoPulo?: string;
  onRegister: () => void;
}

/** Hero quando o atleta pulou o treino de hoje (D1, estado PULADO). */
export function TodaySkippedCard({ motivoPulo, onRegister }: TodaySkippedCardProps) {
  const label = motivoPulo && motivoPulo in MOTIVO_PULO_LABELS ? MOTIVO_PULO_LABELS[motivoPulo as MotivoPulo] : null;

  return (
    <Card
      variant="solid"
      surfaceLevel="panel"
      padding={2.5}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
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
    </Card>
  );
}

export default TodaySkippedCard;
