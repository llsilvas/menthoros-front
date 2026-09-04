import { Box, Typography } from '@mui/material';
import { surface } from '../../../../theme/tokens';
import { zones } from '../../../../theme/activeTheme';
import type { ZonesReading } from '../../adapters/buildProgressReadings';
import { ProgressBlockCard } from './ProgressBlockCard';

export interface ZonesBlockProps {
  reading: ZonesReading;
  periodLabel: string;
}

const ORDEM = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

/** Bloco 2: barras por zona e a dominante em palavras — sem alvo (não existe no contrato) e sem juízo. */
export function ZonesBlock({ reading, periodLabel }: ZonesBlockProps) {
  const dom = reading.dominante.toUpperCase();
  return (
    <ProgressBlockCard pergunta="Estou treinando nas zonas certas?" periodo={periodLabel} testId="progress-zones">
      <Typography variant="body1" sx={{ color: surface[300] }}>
        A maior parte do tempo em <Box component="strong" sx={{ fontWeight: 600, color: surface[50] }}>{dom} — {reading.percentuais[reading.dominante]}%</Box>. Se isso é o combinado, quem sabe é o coach.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} data-testid="progress-zones-bars">
        {ORDEM.map((z) => {
          const key = z.toUpperCase() as keyof typeof zones;
          const pct = reading.percentuais[z];
          return (
            <Box key={z} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }} data-testid="progress-zone-row" data-pct={pct}>
              <Typography variant="caption" sx={{ width: 24, color: surface[400], fontFamily: (t) => t.typography.h6.fontFamily }}>{key}</Typography>
              <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: surface[700], overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: 8, borderRadius: 4, bgcolor: zones[key].color }} />
              </Box>
              <Typography variant="caption" sx={{ width: 32, textAlign: 'right', color: surface[400], fontVariantNumeric: 'tabular-nums' }}>{pct}%</Typography>
            </Box>
          );
        })}
      </Box>
    </ProgressBlockCard>
  );
}
