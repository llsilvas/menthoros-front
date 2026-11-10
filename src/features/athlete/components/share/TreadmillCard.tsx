import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { surface } from '../../../../theme/tokens';
import { formatKm } from '../../../../utils/formatKm';
import type { TreadmillView } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { ShareStat } from './ShareStat';
import { displayNumberSx, labelSx, shareColors } from './shareCardStyle';

export interface TreadmillCardProps {
  view: TreadmillView;
  mostrarFc: boolean;
}

/** Ícone da esteira (SVG inline, sem dependência nova). */
function TreadmillIcon({ tamanho }: { tamanho: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18h15l3-8" />
      <path d="M6 18l-1 3M17 18l1 3" />
      <path d="M8 14h9" />
    </svg>
  );
}

export interface TreadmillBadgeProps {
  /** Adesivo do card Foto (v2 K): maior, girado e com sombra, como os demais adesivos do artboard. */
  adesivo?: boolean;
}

/** Selo "ESTEIRA" (card Esteira e adesivo do card Foto sem trajeto). */
export function TreadmillBadge({ adesivo = false }: TreadmillBadgeProps) {
  return (
    <Box
      data-testid="selo-esteira"
      sx={{
        ...displayNumberSx,
        display: 'inline-flex',
        alignItems: 'center',
        gap: adesivo ? '8px' : '6px',
        px: adesivo ? '16px' : '12px',
        py: adesivo ? '10px' : '7px',
        borderRadius: '999px',
        bgcolor: shareColors.brand,
        color: shareColors.canvas,
        fontSize: adesivo ? 28 : 20,
        lineHeight: 1,
        letterSpacing: '0.02em',
        ...(adesivo && { transform: 'rotate(6deg)', boxShadow: `0 8px 24px ${alpha(surface[900], 0.35)}` }),
      }}
    >
      <TreadmillIcon tamanho={adesivo ? 24 : 18} />
      ESTEIRA
    </Box>
  );
}

/** Corpo do card "Esteira" (v2 I): selo, km ou tempo em destaque, pace e três blocos. */
export function TreadmillCard({ view, mostrarFc }: TreadmillCardProps) {
  const km = view.distanciaKm;
  const temDistancia = km != null;
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TreadmillBadge />
        <GarminAttribution attribution={view.attribution} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Typography component="span" sx={labelSx}>{view.dataLabel}</Typography>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15 }}>{view.titulo}</Typography>
      </Box>

      <Box sx={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <Typography component="span" sx={{ ...displayNumberSx, fontSize: temDistancia ? 120 : 76 }}>
            {km != null ? formatKm(km) : view.duracao}
          </Typography>
          {temDistancia && (
            <Typography component="span" sx={{ ...displayNumberSx, fontSize: 28, color: shareColors.brand, pb: '4px' }}>KM</Typography>
          )}
        </Box>
        {view.paceMedio && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <Typography component="span" sx={{ ...displayNumberSx, fontSize: 56 }}>{view.paceMedio}</Typography>
            <Typography component="span" sx={{ ...displayNumberSx, fontSize: 18, color: shareColors.brand, pb: '3px' }}>/KM</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(0, 1fr)', gap: '6px' }}>
        <ShareStat label="TEMPO" value={view.duracao} />
        {mostrarFc && view.fcMedia != null && <ShareStat label="FC MÉD" value={String(view.fcMedia)} unit="bpm" />}
        {view.tss != null && <ShareStat label="TSS" value={String(view.tss)} />}
      </Box>
    </>
  );
}
