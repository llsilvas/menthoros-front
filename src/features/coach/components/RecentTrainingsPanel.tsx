import { Box, List, ListItem, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RealizadoRecenteDto } from '../../../types/AtletaPerfilCoach';
import { surface, primary } from '../../../theme/tokens';

const SENSACAO_LABELS: Record<string, string> = {
  PERNAS_PESADAS: 'Pernas pesadas', RITMO_TRANQUILO: 'Ritmo tranquilo',
  CALOR: 'Calor', DOR: 'Dor', DORMI_MAL: 'Dormi mal',
};

interface RecentTrainingsPanelProps {
  realizados: RealizadoRecenteDto[];
}

/** Treinos realizados recentes com o feedback do atleta — drilldown do coach (D3, athlete-training-loop). */
export function RecentTrainingsPanel({ realizados }: RecentTrainingsPanelProps) {
  if (realizados.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Nenhum treino nos últimos 7 dias</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {realizados.map((r, i) => (
        <ListItem key={r.id} disableGutters divider={i < realizados.length - 1} sx={{ py: 1, alignItems: 'flex-start', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {format(parseISO(r.dataTreino), "d 'de' MMM", { locale: ptBR })} — {r.tipoTreino ?? 'Treino'}
            </Typography>
            <Typography variant="caption" sx={{ color: surface[400] }}>
              {[r.duracaoMin != null ? `${r.duracaoMin} min` : null, r.fonteDados].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          {r.feedbackRegistradoEm && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: primary[400], fontWeight: 600 }}>
                {[
                  r.percepcaoEsforco != null ? `RPE ${r.percepcaoEsforco}/10` : null,
                  ...(r.sensacoes ?? []).map((s) => SENSACAO_LABELS[s] ?? s),
                ].filter(Boolean).join(' · ')}
              </Typography>
              {r.feedbackAtleta && (
                <Typography variant="caption" sx={{ color: surface[300], fontStyle: 'italic' }}>{r.feedbackAtleta}</Typography>
              )}
            </Box>
          )}
        </ListItem>
      ))}
    </List>
  );
}

export default RecentTrainingsPanel;
