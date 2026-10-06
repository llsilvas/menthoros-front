import { Typography } from '@mui/material';
import { surface, primary } from '../../../theme/tokens';
import { Card } from '../../../shared/components/Card';
import { SENSACAO_LABELS, type Sensacao } from '../../../types/AthleteFeedback';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';
import { tipoTreinoLabel } from '../adapters/homeAdapter';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';
import { WorkoutAnalysisCard } from './WorkoutAnalysisCard';

export interface TodayCompletedCardProps {
  realizado: AthleteRealizadoHoje;
  sensacoes?: Sensacao[];
  comentario?: string;
  /** Análise de IA do mesmo treino (pending/done); ausente, o card fica só com o resumo. */
  analysisView?: WorkoutAnalysisView | null;
}

/** Resumo do dia quando o feedback já foi respondido (D1, estado FEITO). */
export function TodayCompletedCard({ realizado, sensacoes = [], comentario, analysisView }: TodayCompletedCardProps) {
  return (
    <Card
      variant="solid"
      surfaceLevel="panel"
      padding={2.5}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <Typography variant="overline" sx={{ color: surface[400] }}>Treino feito</Typography>
      <Typography variant="h4">{tipoTreinoLabel(realizado.tipoTreino)}</Typography>
      {!analysisView && (
        <Typography variant="body2" sx={{ color: surface[400] }}>
          {[
            realizado.duracaoMin != null ? `${realizado.duracaoMin} min` : null,
            realizado.percepcaoEsforco != null ? `RPE ${realizado.percepcaoEsforco}/10` : null,
          ].filter(Boolean).join(' · ')}
        </Typography>
      )}
      {sensacoes.length > 0 && (
        <Typography variant="body2" sx={{ color: primary[400] }}>
          {sensacoes.map((s) => SENSACAO_LABELS[s]).join(', ')}
        </Typography>
      )}
      {comentario && (
        <Typography variant="body2" sx={{ color: surface[300], fontStyle: 'italic' }}>{comentario}</Typography>
      )}
      {analysisView && <WorkoutAnalysisCard view={analysisView} embedded />}
    </Card>
  );
}

export default TodayCompletedCard;
