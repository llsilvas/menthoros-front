import { Box, Button, Typography } from '@mui/material';
import { CheckCircleOutline as FeitoIcon, Schedule as PendenteIcon } from '@mui/icons-material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { surface, semantic } from '../../../theme/tokens';

export interface CheckInStatusRowProps {
  feito: boolean;
  onFazer: () => void;
  onEditar: () => void;
}

/**
 * Linha de estado do check-in. Sem horário: `CheckinProntidaoOutputDto` expõe só `data` — mostrar
 * "às HH:MM" exigiria `updatedAt` no contrato (follow-up registrado na change).
 */
export function CheckInStatusRow({ feito, onFazer, onEditar }: CheckInStatusRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, px: 1.75, py: 1.5, minHeight: 48 }}>
      {feito
        ? <FeitoIcon sx={{ color: semantic.success[500], fontSize: 20 }} />
        : <PendenteIcon sx={{ color: surface[400], fontSize: 20 }} />}
      <Typography variant="body1" sx={{ flex: 1, fontWeight: 600 }}>
        {feito ? 'Check-in de hoje feito' : 'Check-in de hoje'}
      </Typography>
      {feito
        ? <Button size="small" onClick={onEditar} sx={{ minHeight: 44 }}>Editar</Button>
        : <Button size="small" onClick={onFazer} sx={{ minHeight: 44 }}>Fazer check-in</Button>}
    </Box>
  );
}

export default CheckInStatusRow;
