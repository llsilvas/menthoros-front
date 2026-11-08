import { Box, Typography } from '@mui/material';
import { activeTheme } from '../../../../theme/activeTheme';
import { formatKm } from '../../../../utils/formatKm';
import type { SplitsView } from '../../types/ShareCard';
import { GarminAttribution } from './GarminAttribution';
import { displayNumberSx, labelSx, monoSx, shareColors } from './shareCardStyle';

export interface SplitsCardProps {
  view: SplitsView;
}

/** Corpo do card "Parciais": uma barra por volta; mais rápida = mais alta, melhor em destaque. */
export function SplitsCard({ view }: SplitsCardProps) {
  const paces = view.splits.map((s) => s.paceSeg);
  const rapido = Math.min(...paces);
  const lento = Math.max(...paces);
  const faixa = lento - rapido || 1;
  const cor = activeTheme.trainingStage.esforco;
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography component="span" sx={labelSx}>PARCIAIS · {view.dataLabel}</Typography>
        <Typography component="h2" sx={{ ...displayNumberSx, fontSize: 40, lineHeight: 0.9 }}>
          {view.titulo.toUpperCase()}
        </Typography>
        <GarminAttribution attribution={view.attribution} />
      </Box>

      <Box
        role="list"
        aria-label={`Pace por volta: ${view.splits.map((s) => s.pace).join(', ')} por km`}
        sx={{ flex: '1 1 0', minHeight: 80, display: 'flex', alignItems: 'flex-end', gap: '6px' }}
      >
        {view.splits.map((s) => (
          <Box key={s.n} role="listitem" sx={{ flex: '1 1 0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <Typography component="span" sx={{ ...monoSx, fontSize: view.splits.length > 8 ? 8 : 10 }}>{s.pace}</Typography>
            <Box
              sx={{
                width: '100%',
                height: `${Math.round(40 + ((lento - s.paceSeg) / faixa) * 55)}%`,
                bgcolor: cor,
                opacity: s.isBest ? 1 : 0.6,
                borderRadius: '999px',
              }}
            />
            <Typography component="span" sx={{ fontSize: 9, color: shareColors.textSecondary }}>{s.n}</Typography>
          </Box>
        ))}
      </Box>

      <Typography component="span" sx={{ ...monoSx, fontSize: 13 }}>
        {view.distanciaKm != null ? `${formatKm(view.distanciaKm)} km · ` : ''}{view.duracao}
      </Typography>
    </>
  );
}
