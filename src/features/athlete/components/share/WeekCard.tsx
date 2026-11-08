import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { surface } from '../../../../theme/tokens';
import { formatKm } from '../../../../utils/formatKm';
import type { WeekView } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { ShareStat } from './ShareStat';
import { displayNumberSx, labelSx, shareColors } from './shareCardStyle';

export interface WeekCardProps {
  view: WeekView;
}

/** Corpo do card "Semana": km da semana, barras por dia na cor do tipo de treino e totais. */
export function WeekCard({ view }: WeekCardProps) {
  const maior = Math.max(...view.dias.map((d) => d.km), 1);
  const descricao = view.dias.map((d) => `${d.label} ${d.km ? `${formatKm(d.km)} km` : 'descanso'}`).join(', ');
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography component="span" sx={labelSx}>SEMANA · {view.rangeLabel}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <Typography component="span" sx={{ ...displayNumberSx, fontSize: 64 }}>{formatKm(view.totalKm)}</Typography>
          <Typography component="span" sx={{ ...displayNumberSx, fontSize: 18, color: shareColors.brand, pb: '3px' }}>KM</Typography>
        </Box>
        <GarminAttribution attribution={view.attribution} />
      </Box>

      <Box sx={{ flex: '1 1 0', minHeight: 50, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Box role="img" aria-label={`Quilômetros por dia: ${descricao}`} sx={{ flex: '1 1 0', minHeight: 0, display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          {view.dias.map((d, i) => (
            <Box
              key={i}
              sx={{
                flex: '1 1 0',
                height: d.km ? `${Math.max(8, Math.round((d.km / maior) * 100))}%` : '6%',
                bgcolor: d.color ?? alpha(surface[0], 0.15),
                borderRadius: '999px',
              }}
            />
          ))}
        </Box>
        <Box aria-hidden sx={{ display: 'flex', gap: '6px' }}>
          {view.dias.map((d, i) => (
            <Typography key={i} component="span" sx={{ flex: '1 1 0', textAlign: 'center', fontSize: 9, color: shareColors.textSecondary }}>
              {d.label}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
        <ShareStat label="TREINOS" value={String(view.treinos)} />
        <ShareStat label="TEMPO" value={view.tempoTotal} />
      </Box>
    </>
  );
}
