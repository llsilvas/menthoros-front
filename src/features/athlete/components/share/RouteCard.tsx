import { Box, Typography } from '@mui/material';
import { formatKm } from '../../../../utils/formatKm';
import type { RouteView } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { RouteTrace } from './RouteTrace';
import { ShareStat } from './ShareStat';
import { displayNumberSx, labelSx, shareColors } from './shareCardStyle';

export interface RouteCardProps {
  view: RouteView;
  mostrarFc: boolean;
}

/** Corpo do card "Rota": o trajeto ocupa o card, com km em destaque e três métricas. */
export function RouteCard({ view, mostrarFc }: RouteCardProps) {
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography component="span" sx={labelSx}>ROTA · {view.dataLabel}</Typography>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>{view.titulo}</Typography>
        <GarminAttribution attribution={view.attribution} />
      </Box>

      <Box data-testid="route-trace" sx={{ flex: '1 1 0', minHeight: 120 }}>
        <RouteTrace pontos={view.pontos} largura={316} altura={300} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
        <Typography component="span" sx={{ ...displayNumberSx, fontSize: 84 }}>
          {view.distanciaKm != null ? formatKm(view.distanciaKm) : view.duracao}
        </Typography>
        {view.distanciaKm != null && (
          <Typography component="span" sx={{ ...displayNumberSx, fontSize: 22, color: shareColors.brand, pb: '4px' }}>KM</Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
        <ShareStat label="TEMPO" value={view.duracao} />
        <ShareStat label="PACE" value={view.paceMedio ?? '—'} unit={view.paceMedio ? '/km' : undefined} />
        {mostrarFc && view.fcMedia != null && <ShareStat label="FC MÉD" value={String(view.fcMedia)} unit="bpm" />}
      </Box>
    </>
  );
}
