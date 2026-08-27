import { useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { primary, surface, content, backgrounds } from '../../../theme/tokens';
import { SENSACAO_LABELS, type Sensacao } from '../../../types/AthleteFeedback';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';
import { tipoTreinoLabel } from '../adapters/homeAdapter';

const FONTE_LABELS: Record<string, string> = {
  INTERVALS_ICU: 'intervals.icu', STRAVA: 'Strava', GARMIN: 'Garmin', MANUAL: 'registro manual',
};

const RPE = Array.from({ length: 10 }, (_, i) => i + 1);
const SENSACOES = Object.keys(SENSACAO_LABELS) as Sensacao[];

export interface TodayFeedbackCardProps {
  realizado: AthleteRealizadoHoje;
  onSubmit: (input: { percepcaoEsforco: number; sensacoes: Sensacao[]; comentario?: string }) => Promise<void>;
  submitting?: boolean;
  error?: string;
}

/** "Como foi?" no hero da Home — um envio: RPE (10 alvos de 40px), sensações, frase opcional. */
export function TodayFeedbackCard({ realizado, onSubmit, submitting = false, error }: TodayFeedbackCardProps) {
  const [rpe, setRpe] = useState<number | null>(realizado.percepcaoEsforco ?? null);
  const [sensacoes, setSensacoes] = useState<Sensacao[]>([]);
  const [comentario, setComentario] = useState('');

  const toggleSensacao = (s: Sensacao) =>
    setSensacoes((atual) => (atual.includes(s) ? atual.filter((x) => x !== s) : [...atual, s]));

  const enviar = async () => {
    if (rpe == null) return;
    await onSubmit({ percepcaoEsforco: rpe, sensacoes, comentario: comentario.trim() || undefined });
  };

  const fonte = realizado.fonteDados ? FONTE_LABELS[realizado.fonteDados] ?? realizado.fonteDados : null;

  return (
    <Box
      sx={{
        bgcolor: elevation.panel, border: `1px solid ${surface[700]}`, borderRadius: radius.lg,
        p: 2.5, display: 'flex', flexDirection: 'column', gap: 2,
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: surface[400] }}>Treino feito</Typography>
        <Typography variant="h4">{tipoTreinoLabel(realizado.tipoTreino)}</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          {[
            realizado.duracaoMin != null ? `${realizado.duracaoMin} min` : null,
            realizado.distanciaKm != null ? `${realizado.distanciaKm} km` : null,
            fonte,
          ].filter(Boolean).join(' · ')}
        </Typography>
      </Box>

      <Typography variant="subtitle1">Como foi?</Typography>

      <Box>
        <Typography variant="body2" sx={{ color: surface[400], mb: 1 }}>Percepção de esforço</Typography>
        <Box role="radiogroup" aria-label="Percepção de esforço" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {RPE.map((n) => (
            <Box
              key={n}
              component="button"
              type="button"
              role="radio"
              aria-checked={rpe === n}
              onClick={() => setRpe(n)}
              sx={{
                width: 40, height: 40, borderRadius: '50%', border: `1px solid ${rpe === n ? primary[500] : content.cardBorder}`,
                bgcolor: rpe === n ? primary[500] : content.cardBg,
                color: rpe === n ? backgrounds.canvas : surface[200],
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              {n}
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ color: surface[400], mb: 1 }}>Sensações (opcional)</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SENSACOES.map((s) => (
            <Chip
              key={s}
              label={SENSACAO_LABELS[s]}
              onClick={() => toggleSensacao(s)}
              role="checkbox"
              aria-checked={sensacoes.includes(s)}
              sx={{
                bgcolor: sensacoes.includes(s) ? primary[500] : content.cardBg,
                color: sensacoes.includes(s) ? backgrounds.canvas : surface[200],
                fontWeight: sensacoes.includes(s) ? 700 : 400,
                border: `1px solid ${sensacoes.includes(s) ? primary[500] : content.cardBorder}`,
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      </Box>

      <TextField
        multiline minRows={2} placeholder="Alguma frase sobre o treino? (opcional)"
        value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 1000))}
        fullWidth
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained" fullWidth disabled={rpe == null || submitting} onClick={enviar}
        sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 48, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
      >
        {submitting ? 'Enviando…' : 'Enviar'}
      </Button>
    </Box>
  );
}

export default TodayFeedbackCard;
