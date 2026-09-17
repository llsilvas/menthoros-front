import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { surface, primary } from '../../../../theme/tokens';
import { ROUTES } from '../../../../constants/routes';
import type { EffortsReading } from '../../adapters/effortsAdapter';
import type { MelhoresEsforcosJanela } from '../../../../types/AthleteProgress';
import { ProgressBlockCard } from './ProgressBlockCard';

export interface EffortsBlockProps {
  reading: EffortsReading;
  janela: MelhoresEsforcosJanela;
  onJanelaChange: (janela: MelhoresEsforcosJanela) => void;
}

const JANELAS: Array<{ value: MelhoresEsforcosJanela; label: string }> = [
  { value: '42d', label: '42 dias' },
  { value: '1y', label: '1 ano' },
  { value: 'all', label: 'Histórico' },
];

function JanelaSelector({ janela, onJanelaChange }: Pick<EffortsBlockProps, 'janela' | 'onJanelaChange'>) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {JANELAS.map((j) => {
        const active = j.value === janela;
        return (
          <Box
            key={j.value}
            component="button"
            type="button"
            onClick={() => onJanelaChange(j.value)}
            aria-pressed={active}
            sx={{
              px: 1,
              py: 0.25,
              fontSize: '0.72rem',
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              border: 'none',
              borderRadius: 1,
              bgcolor: active ? primary[500] : 'transparent',
              color: active ? surface[900] : surface[400],
            }}
          >
            {j.label}
          </Box>
        );
      })}
    </Box>
  );
}

/** Bloco 5: melhores esforços por distância (400m-10k), lidos do intervals.icu. */
export function EffortsBlock({ reading, janela, onJanelaChange }: EffortsBlockProps) {
  const { rows, integracaoConectada } = reading;

  if (!integracaoConectada) {
    return (
      <ProgressBlockCard pergunta="Quais são meus melhores tempos?" testId="progress-efforts">
        <Typography variant="body2" sx={{ color: surface[400] }}>
          Conecte sua conta do intervals.icu pra ver seus melhores tempos por distância (400m a 10k).
        </Typography>
        <Link component={RouterLink} to={ROUTES.ATHLETE_PROFILE} variant="body2" sx={{ color: primary[500], fontWeight: 600 }}>
          Conectar intervals.icu →
        </Link>
      </ProgressBlockCard>
    );
  }

  return (
    <ProgressBlockCard
      pergunta="Quais são meus melhores tempos?"
      testId="progress-efforts"
      acao={<JanelaSelector janela={janela} onJanelaChange={onJanelaChange} />}
    >
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: surface[400] }}>
          Nenhum esforço nessa janela ainda.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => (
            <Box
              key={r.distanciaLabel}
              data-testid="progress-effort-row"
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25,
                borderBottom: i < rows.length - 1 ? `1px solid ${surface[700]}` : 'none',
              }}
            >
              <Typography variant="body1" sx={{ width: 56, fontWeight: 600 }}>{r.distanciaLabel}</Typography>
              <Typography
                variant="body1"
                sx={{ flex: 1, fontFamily: (t) => t.typography.h6.fontFamily, fontWeight: 700, color: surface[50], fontVariantNumeric: 'tabular-nums' }}
              >
                {r.tempoFormatado}
              </Typography>
              <Typography variant="caption" sx={{ color: surface[500] }}>{r.paceLabel}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </ProgressBlockCard>
  );
}
