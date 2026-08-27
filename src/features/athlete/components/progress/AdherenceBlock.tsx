import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { primary, surface } from '../../../../theme/tokens';
import type { AdherenceReading } from '../../adapters/buildProgressReadings';
import { ProgressBlockCard } from './ProgressBlockCard';

export interface AdherenceBlockProps {
  reading: AdherenceReading;
}

/** Bloco 3: N de M em 4 semanas, barras por semana; sem explicar o que faltou (o contrato não traz). */
export function AdherenceBlock({ reading }: AdherenceBlockProps) {
  return (
    <ProgressBlockCard pergunta="Estou cumprindo o plano?" periodo="4 semanas" testId="progress-adherence">
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h3" data-testid="progress-adherence-count">
          {reading.realizado} <Box component="span" sx={{ fontSize: '0.6em', color: surface[500] }}>de {reading.planejado}</Box>
        </Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>treinos feitos · {reading.percentual}%</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1, alignItems: 'end' }}>
        {reading.semanas.map((s) => {
          const pct = s.planejado > 0 ? (s.realizado / s.planejado) * 100 : 0;
          return (
            <Box key={s.semanaInicio} data-testid="progress-week-bar" data-current={s.corrente ? 'true' : undefined} data-no-plan={s.semPlano ? 'true' : undefined} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: '100%', height: 48, borderRadius: 1.5, bgcolor: surface[700], position: 'relative', overflow: 'hidden', opacity: s.semPlano ? 0.4 : 1 }}>
                <Box sx={{ position: 'absolute', bottom: 0, width: '100%', height: `${pct}%`, bgcolor: s.corrente ? alpha(primary[500], 0.45) : primary[500] }} />
              </Box>
              <Typography variant="caption" sx={{ color: s.corrente ? primary[500] : surface[400], fontVariantNumeric: 'tabular-nums' }}>
                {s.semPlano ? 'sem plano' : `${s.realizado}/${s.planejado}${s.corrente ? ' · esta' : ''}`}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </ProgressBlockCard>
  );
}
