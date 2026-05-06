import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PendingActivityReview, ReconciliationAction } from '../../../types/Reconciliacao';
import { CandidatoItem } from './CandidatoItem';
import type { CandidateMatch } from '../../../types/Reconciliacao';
import { colors } from '../../../theme/tokens';

interface AtividadePendenteCardProps {
  activity: PendingActivityReview;
  candidatos: { data: CandidateMatch[]; loading: boolean; error: string | null };
  onToggleExpanded: (id: string) => void;
  onExecutarAcao: (id: string, action: ReconciliationAction, treinoPlanejadoId?: string) => Promise<void>;
  disabled?: boolean;
}

const statusColors: Record<string, 'warning' | 'default' | 'error'> = {
  AMBIGUO: 'warning',
  NAO_PLANEJADO: 'default',
  VINCULADO_AUTOMATICO: 'default',
  VINCULADO_MANUALMENTE: 'default',
};

const statusLabels: Record<string, string> = {
  AMBIGUO: 'Ambíguo',
  NAO_PLANEJADO: 'Não planejado',
  VINCULADO_AUTOMATICO: 'Vinculado (auto)',
  VINCULADO_MANUALMENTE: 'Vinculado (manual)',
};

export function AtividadePendenteCard({
  activity,
  candidatos,
  onToggleExpanded,
  onExecutarAcao,
  disabled = false,
}: AtividadePendenteCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: ReconciliationAction;
    treinoPlanejadoId?: string;
  } | null>(null);
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null);

  const dataTreino = format(parseISO(activity.dataTreino), 'dd MMM yyyy', { locale: ptBR });

  const handleAcaoClick = (action: ReconciliationAction, treinoPlanejadoId?: string) => {
    setConfirmAction({ action, treinoPlanejadoId });
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmDialogOpen(false);
    try {
      await onExecutarAcao(activity.id, confirmAction.action, confirmAction.treinoPlanejadoId);
      setSelectedCandidatoId(null);
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Accordion
        expanded={activity.isExpanded ?? false}
        onChange={() => onToggleExpanded(activity.id)}
        sx={{
          mb: 1,
          backgroundColor: 'rgba(255,255,255,0.50)',
          border: '1px solid rgba(255,255,255,0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.55)',
          },
          '&.Mui-expanded': {
            backgroundColor: 'rgba(255,255,255,0.55)',
          },
        }}
        slotProps={{
          transition: { unmountOnExit: false },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1} minWidth={0}>
            <Chip
              label={statusLabels[activity.reconciliationStatus]}
              color={statusColors[activity.reconciliationStatus] as 'warning' | 'default'}
              size="small"
              variant="outlined"
            />
            <Stack spacing={0.25} flex={1} minWidth={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {activity.atletaNome}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {dataTreino} • {activity.tipoTreino}
                {activity.distanciaKm && ` • ${activity.distanciaKm.toFixed(1)} km`}
                {activity.duracaoMin && ` • ${Math.floor(activity.duracaoMin / 60)}h`}
              </Typography>
            </Stack>

            {activity.reconciliationStatus === 'AMBIGUO' && (
              <Stack direction="row" gap={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcaoClick('MARCAR_NAO_PLANEJADO');
                  }}
                  disabled={disabled || activity.isSubmitting}
                >
                  Não Planejado
                </Button>
              </Stack>
            )}

            {activity.reconciliationStatus === 'NAO_PLANEJADO' && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcaoClick('DESFAZER_VINCULO');
                }}
                disabled={disabled || activity.isSubmitting}
              >
                Desfazer
              </Button>
            )}
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 2, pb: 2 }}>
          {activity.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {activity.error}
            </Alert>
          )}

          {candidatos.loading && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Carregando candidatos...
              </Typography>
            </Stack>
          )}

          {candidatos.error && (
            <Alert severity="error">Erro ao carregar candidatos: {candidatos.error}</Alert>
          )}

          {!candidatos.loading && candidatos.data.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Nenhum candidato encontrado para esta atividade.
            </Typography>
          )}

          {!candidatos.loading && candidatos.data.length > 0 && (
            <>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                Selecione um treino planejado para vincular:
              </Typography>
              <Stack spacing={0}>
                {candidatos.data.map((c) => (
                  <CandidatoItem
                    key={c.treinoPlanejadoId}
                    candidato={c}
                    selected={selectedCandidatoId === c.treinoPlanejadoId}
                    onSelect={(id) => setSelectedCandidatoId(id)}
                  />
                ))}
              </Stack>

              {activity.reconciliationStatus === 'AMBIGUO' && selectedCandidatoId && (
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    bgcolor: colors.secondary.main,
                    color: colors.primary.dark,
                  }}
                  onClick={() => handleAcaoClick('VINCULAR_MANUALMENTE', selectedCandidatoId)}
                  disabled={disabled || activity.isSubmitting}
                  fullWidth
                >
                  {activity.isSubmitting ? 'Vinculando...' : 'Vincular Selecionado'}
                </Button>
              )}
            </>
          )}
        </AccordionDetails>
      </Accordion>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar ação</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            {confirmAction?.action === 'VINCULAR_MANUALMENTE' &&
              `Deseja vincular "${activity.atletaNome}" a este treino planejado?`}
            {confirmAction?.action === 'MARCAR_NAO_PLANEJADO' &&
              `Marcar "${activity.atletaNome}" como não planejado?`}
            {confirmAction?.action === 'DESFAZER_VINCULO' &&
              `Desfazer vínculo de "${activity.atletaNome}"?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{
              bgcolor: confirmAction?.action === 'DESFAZER_VINCULO' ? 'error.main' : colors.secondary.main,
              color: confirmAction?.action === 'DESFAZER_VINCULO' ? 'white' : colors.primary.dark,
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
