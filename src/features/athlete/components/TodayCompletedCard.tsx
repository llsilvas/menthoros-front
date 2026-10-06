import { Typography } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { surface, primary } from '../../../theme/tokens';
import { Card } from '../../../shared/components/Card';
import { SENSACAO_LABELS, type Sensacao } from '../../../types/AthleteFeedback';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';
import { tipoTreinoLabel } from '../adapters/homeAdapter';

export interface TodayCompletedCardProps {
  realizado: AthleteRealizadoHoje;
  sensacoes?: Sensacao[];
  comentario?: string;
  /** Abre a análise de IA do treino (TodayWorkoutAnalysisDrawer). Sem a prop, o card fica estático. */
  onClick?: () => void;
}

/** Resumo do dia quando o feedback já foi respondido (D1, estado FEITO). */
export function TodayCompletedCard({ realizado, sensacoes = [], comentario, onClick }: TodayCompletedCardProps) {
  return (
    <Card
      variant="solid"
      surfaceLevel="panel"
      padding={2.5}
      onClick={onClick}
      {...(onClick
        ? { component: 'button', 'aria-label': 'Ver análise do treino' }
        : {})}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        position: 'relative',
        ...(onClick ? { width: '100%', textAlign: 'left', border: 'none', font: 'inherit' } : {}),
      }}
    >
      {onClick && (
        <ChevronRightIcon sx={{ position: 'absolute', top: 20, right: 20, color: surface[500] }} />
      )}
      <Typography variant="overline" sx={{ color: surface[400] }}>Treino feito</Typography>
      <Typography variant="h4">{tipoTreinoLabel(realizado.tipoTreino)}</Typography>
      <Typography variant="body2" sx={{ color: surface[400] }}>
        {[
          realizado.duracaoMin != null ? `${realizado.duracaoMin} min` : null,
          realizado.percepcaoEsforco != null ? `RPE ${realizado.percepcaoEsforco}/10` : null,
        ].filter(Boolean).join(' · ')}
      </Typography>
      {sensacoes.length > 0 && (
        <Typography variant="body2" sx={{ color: primary[400] }}>
          {sensacoes.map((s) => SENSACAO_LABELS[s]).join(', ')}
        </Typography>
      )}
      {comentario && (
        <Typography variant="body2" sx={{ color: surface[300], fontStyle: 'italic' }}>{comentario}</Typography>
      )}
    </Card>
  );
}

export default TodayCompletedCard;
