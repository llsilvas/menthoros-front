import { Box, Typography } from '@mui/material';
import { formatKm } from '../../../../utils/formatKm';
import type { PlanVsActualView } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { ShareStat } from './ShareStat';
import { displayNumberSx, labelSx, shareColors } from './shareCardStyle';

export interface PlanVsActualCardProps {
  view: PlanVsActualView;
  mostrarFc: boolean;
}

/** Corpo do card "Plano × realizado": o desenho do treino planejado e o que foi feito. */
export function PlanVsActualCard({ view, mostrarFc }: PlanVsActualCardProps) {
  const totalPeso = view.blocos.reduce((acc, b) => acc + b.weight, 0) || 1;
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography component="span" sx={labelSx}>O PLANO. A EXECUÇÃO. · {view.dataLabel}</Typography>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>{view.titulo}</Typography>
        <GarminAttribution attribution={view.attribution} />
      </Box>

      <Box
        aria-hidden
        sx={{ flex: '1 1 0', minHeight: 60, display: 'flex', alignItems: 'flex-end', gap: '3px' }}
      >
        {view.blocos.map((b) => (
          <Box
            key={b.key}
            sx={{ flex: `${b.weight / totalPeso} 1 0`, height: `${b.heightPct}%`, bgcolor: b.color, borderRadius: '999px' }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
        <Typography component="span" sx={{ ...displayNumberSx, fontSize: 84 }}>
          {view.distanciaKm != null ? formatKm(view.distanciaKm) : view.duracao}
        </Typography>
        <Typography component="span" sx={{ ...displayNumberSx, fontSize: 22, color: shareColors.brand, pb: '4px' }}>
          {view.distanciaKm != null ? 'KM' : ''}
        </Typography>
        {view.distanciaPlanejadaKm != null && view.distanciaKm != null && (
          <Typography component="span" sx={{ fontSize: 12, color: shareColors.textSecondary, pb: '6px', ml: 'auto' }}>
            de {formatKm(view.distanciaPlanejadaKm)} km planejados
          </Typography>
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
