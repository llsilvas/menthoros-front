import { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { primary, surface, content, backgrounds } from '../../../theme/tokens';
import { MOTIVO_PULO_LABELS, type MotivoPulo } from '../../../types/AthleteWorkoutToday';

const MOTIVOS = Object.keys(MOTIVO_PULO_LABELS) as MotivoPulo[];

/** Chip é rótulo, não frase — só a primeira letra maiúscula, mesma fonte de `MOTIVO_PULO_LABELS`. */
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface SkipWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo?: MotivoPulo) => Promise<void>;
  submitting?: boolean;
  error?: string;
}

/** Motivo é opcional de propósito — o dado ajuda o coach, mas não pode virar fricção para pular. */
export function SkipWorkoutDialog({ open, onClose, onConfirm, submitting = false, error }: SkipWorkoutDialogProps) {
  const [motivo, setMotivo] = useState<MotivoPulo | undefined>(undefined);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Não vou conseguir hoje</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          O motivo é opcional — ajuda seu coach a entender a semana.
        </Typography>
        <Box role="radiogroup" aria-label="Motivo" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {MOTIVOS.map((m) => (
            <Chip
              key={m}
              label={capitalizar(MOTIVO_PULO_LABELS[m])}
              onClick={() => setMotivo((atual) => (atual === m ? undefined : m))}
              role="radio"
              aria-checked={motivo === m}
              sx={{
                bgcolor: motivo === m ? primary[500] : content.cardBg,
                color: motivo === m ? backgrounds.canvas : surface[200],
                fontWeight: motivo === m ? 700 : 400,
                border: `1px solid ${motivo === m ? primary[500] : content.cardBorder}`,
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button onClick={() => onConfirm(motivo)} disabled={submitting} variant="contained">
          {submitting ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SkipWorkoutDialog;
