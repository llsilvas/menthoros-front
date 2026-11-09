import { useMemo } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { buildRouteFromGpsTrace, type LatLng } from '../../adapters/buildRouteFromGpsTrace';
import { shareColors } from './shareCardStyle';

export interface RouteTraceProps {
  pontos: LatLng[];
  largura: number;
  altura: number;
  /** Espessura da linha no viewBox. */
  espessura?: number;
}

/**
 * Traçado do trajeto em cor única com brilho (athlete-share-cards-mapa, D3). Início vazado, fim
 * cheio. Decorativo para leitor de tela: o card que o contém descreve o treino no `aria-label`.
 */
export function RouteTrace({ pontos, largura, altura, espessura = 4 }: RouteTraceProps) {
  const rota = useMemo(() => buildRouteFromGpsTrace(pontos, largura, altura), [pontos, largura, altura]);
  if (!rota) return null;
  const cor = shareColors.brand;
  return (
    <Box component="svg" aria-hidden viewBox={`0 0 ${largura} ${altura}`} sx={{ width: '100%', height: '100%', display: 'block' }}>
      <path d={rota.d} fill="none" stroke={alpha(cor, 0.25)} strokeWidth={espessura * 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={rota.d} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={rota.inicio[0]} cy={rota.inicio[1]} r={espessura * 1.6} fill={shareColors.canvas} stroke={cor} strokeWidth={espessura * 0.7} />
      <circle cx={rota.fim[0]} cy={rota.fim[1]} r={espessura * 1.6} fill={cor} />
    </Box>
  );
}
