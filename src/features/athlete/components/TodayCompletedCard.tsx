import { Box, Typography } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { surface, primary } from '../../../theme/tokens';
import { SENSACAO_LABELS, type Sensacao } from '../../../types/AthleteFeedback';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';
import { tipoTreinoLabel } from '../adapters/homeAdapter';

export interface TodayCompletedCardProps {
  realizado: AthleteRealizadoHoje;
  sensacoes?: Sensacao[];
  comentario?: string;
}

/** Resumo do dia quando o feedback já foi respondido (D1, estado FEITO). */
export function TodayCompletedCard({ realizado, sensacoes = [], comentario }: TodayCompletedCardProps) {
  return (
    <Box
      sx={{
        bgcolor: elevation.panel, border: `1px solid ${surface[700]}`, borderRadius: radius.lg,
        p: 2.5, display: 'flex', flexDirection: 'column', gap: 1,
      }}
    >
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
    </Box>
  );
}

export default TodayCompletedCard;
