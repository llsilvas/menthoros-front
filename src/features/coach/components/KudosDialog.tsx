import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { surface } from '../../../theme/tokens';
import type { MotivoKudos } from '../../../types/Kudos';

const MOTIVO_LABELS: Record<MotivoKudos, string> = {
  CONSISTENCIA: 'Consistência',
  MELHORA: 'Melhora',
  ESFORCO: 'Esforço',
  SUPERACAO: 'Superação',
  VOLTA: 'Volta por cima',
};

const MOTIVOS = Object.keys(MOTIVO_LABELS) as MotivoKudos[];

export interface KudosDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (motivo: MotivoKudos) => Promise<void>;
  error?: string;
  submitting?: boolean;
}

export function KudosDialog({ open, onClose, onSubmit, error, submitting }: KudosDialogProps) {
  const [motivo, setMotivo] = useState<MotivoKudos>('CONSISTENCIA');

  // O dialog não desmonta ao fechar (fica sempre na árvore, só alterna `open`) — sem este efeito,
  // o motivo escolhido numa sessão anterior (cancelada ou enviada) permaneceria selecionado na
  // próxima abertura, arriscando enviar o motivo errado por engano (achado do Codex review).
  useEffect(() => {
    if (open) setMotivo('CONSISTENCIA');
  }, [open]);

  async function handleConfirmar() {
    try {
      await onSubmit(motivo);
    } catch {
      // falha: mantém o dialog aberto — o alerta de erro (prop `error`) fica a cargo do caller
    }
  }

  return (
    <CoachDialog
      open={open}
      onClose={onClose}
      disableClose={submitting}
      maxWidth="xs"
      title="Reconhecer progresso"
      subtitle="Escolha o motivo do reconhecimento para este atleta."
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={submitting} sx={{ ...GHOST_BTN_SX, fontSize: '0.8rem' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmar}
            disabled={submitting}
            sx={{ ...PRIMARY_BTN_SX, fontSize: '0.8rem', px: 2.5 }}
          >
            {submitting ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Reconhecer'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography sx={{ color: surface[400], fontSize: '0.8rem', mb: 1 }}>Motivo</Typography>
      <FormControl fullWidth size="small" disabled={submitting}>
        <Select value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoKudos)}>
          {MOTIVOS.map((m) => (
            <MenuItem key={m} value={m}>
              {MOTIVO_LABELS[m]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </CoachDialog>
  );
}

export default KudosDialog;
