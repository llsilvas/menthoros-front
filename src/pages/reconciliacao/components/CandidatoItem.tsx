import { Card, LinearProgress, Stack, Typography, Button, Box } from '@mui/material';
import type { CandidateMatch } from '../../../types/Reconciliacao';
import { alpha } from '@mui/material/styles';
import { colors, semantic, primary } from '../../../theme/tokens';
import { overlayWhite, overlayBlack } from '../../../theme/overlays';

interface CandidatoItemProps {
  candidato: CandidateMatch;
  onSelect: (candidatoId: string) => void;
  selected: boolean;
}

export function CandidatoItem({ candidato, onSelect, selected }: CandidatoItemProps) {
  const scorePercent = (candidato.score * 100).toFixed(0);
  const isHighScore = candidato.score >= 0.7;

  return (
    <Card
      sx={{
        mb: 1.5,
        p: 2,
        cursor: 'pointer',
        border: selected ? `2px solid ${colors.secondary.main}` : `1px solid ${overlayWhite[20]}`,
        backgroundColor: selected ? alpha(primary[500], 0.08) : overlayWhite[45],
        transition: 'all 150ms ease',
        '&:hover': {
          backgroundColor: overlayWhite[55],
          boxShadow: `0 4px 12px ${overlayBlack[15]}`,
        },
      }}
      onClick={() => onSelect(candidato.treinoPlanejadoId)}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box flex={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {candidato.data} • {candidato.tipoTreino}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {candidato.distanciaKm ? `${candidato.distanciaKm.toFixed(1)} km` : '—'} •{' '}
            {candidato.duracaoMin ? `${Math.floor(candidato.duracaoMin / 60)}h${candidato.duracaoMin % 60}m` : '—'}
          </Typography>
        </Box>
        {selected && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: colors.secondary.main,
              color: colors.primary.dark,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            Selecionado
          </Typography>
        )}
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <LinearProgress
          variant="determinate"
          value={Math.min(parseFloat(scorePercent), 100)}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: overlayBlack[10],
            '& .MuiLinearProgress-bar': {
              backgroundColor: isHighScore ? colors.secondary.main : semantic.warning[400],
              borderRadius: 3,
            },
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600, minWidth: '40px' }}>
          {scorePercent}%
        </Typography>
      </Stack>

      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Temporal: {candidato.scoreBreakdown.scoreTemporal.toFixed(2)} •
          Duração: {candidato.scoreBreakdown.scoreDuracao.toFixed(2)} •
          Distância: {candidato.scoreBreakdown.scoreDistancia.toFixed(2)}
        </Typography>
      </Stack>

      {selected && (
        <Box mt={1.5} pt={1.5} sx={{ borderTop: `1px solid ${overlayBlack[10]}` }}>
          <Button
            variant="contained"
            size="small"
            sx={{ bgcolor: colors.secondary.main, color: colors.primary.dark }}
          >
            Vincular a este
          </Button>
        </Box>
      )}
    </Card>
  );
}
