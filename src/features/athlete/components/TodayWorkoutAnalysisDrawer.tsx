import { useMemo } from 'react';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { useAthleteWorkoutAnalysis } from '../hooks/useAthleteWorkoutAnalysis';
import { buildWorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';
import { WorkoutAnalysisCard } from './WorkoutAnalysisCard';

export interface TodayWorkoutAnalysisDrawerProps {
  /** Id do `TreinoRealizado` de hoje; `null` mantém o hook em `idle` e o drawer fechado. */
  realizadoId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet leve para revisitar a análise de IA a partir do `TodayCompletedCard` (Home).
 * Deliberadamente mais simples que `WorkoutDetailDrawer`: a Home só tem o realizado, sem o
 * planejado associado (etapas/perfil), então aqui só a análise é exibida.
 */
export function TodayWorkoutAnalysisDrawer({ realizadoId, open, onClose }: TodayWorkoutAnalysisDrawerProps) {
  const { analysis, status } = useAthleteWorkoutAnalysis(open ? realizadoId : null);
  const analysisView = useMemo(() => (analysis ? buildWorkoutAnalysisView(analysis) : null), [analysis]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: elevation.panel, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90vh' } }}
    >
      <Box sx={{ p: 2, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">Análise do treino</Typography>
          <IconButton aria-label="Fechar" onClick={onClose} sx={{ color: surface[400] }}><CloseIcon /></IconButton>
        </Box>

        {analysisView && (status === 'done' || status === 'pending') && (
          <WorkoutAnalysisCard view={analysisView} />
        )}

        {status === 'error' && (
          <Typography variant="caption" sx={{ color: surface[500] }}>
            Não foi possível carregar a análise agora. Ela continua guardada neste treino.
          </Typography>
        )}

        {status === 'empty' && (
          <Typography variant="caption" sx={{ color: surface[500] }}>
            Este treino não tem análise disponível.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

export default TodayWorkoutAnalysisDrawer;
