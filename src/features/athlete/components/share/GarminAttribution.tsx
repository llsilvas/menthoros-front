import { Box, Typography } from '@mui/material';
import type { GarminAttributionView } from '../../types/ShareCard';
import { monoSx, shareColors } from './shareCardStyle';

export interface GarminAttributionProps {
  attribution: GarminAttributionView | null;
}

/**
 * Atribuição exigida pela Garmin (API Brand Guidelines v6.30.2025, Visual and Social Media):
 * texto "GARMIN [modelo]" visível em toda imagem com dado do dispositivo, logo abaixo do título.
 */
export function GarminAttribution({ attribution }: GarminAttributionProps) {
  if (!attribution) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }} data-testid="garmin-attribution">
      <Typography component="span" sx={{ ...monoSx, fontSize: 10, letterSpacing: '0.06em', color: shareColors.textSecondary }}>
        {attribution.label}
      </Typography>
      {attribution.derived && (
        <Typography component="span" sx={{ fontSize: 10, color: shareColors.textSecondary }}>
          Inclui dados de dispositivo Garmin
        </Typography>
      )}
    </Box>
  );
}
