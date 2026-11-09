import { forwardRef, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { ShareFormat } from '../../types/ShareCard';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, shareColors } from './shareCardStyle';

export interface ShareCardFrameProps {
  format: ShareFormat;
  /** Descrição do card para leitor de tela (CA9). */
  ariaLabel: string;
  children: ReactNode;
  /** Rodapé (assinatura da assessoria). */
  footer?: ReactNode;
}

/**
 * Moldura comum dos cards: fundo navy com brilho lime, marca no topo e rodapé. É também o nó
 * rasterizado na exportação — por isso sem `backdrop-filter` nem filtros SVG (design D5).
 */
export const ShareCardFrame = forwardRef<HTMLDivElement, ShareCardFrameProps>(function ShareCardFrame(
  { format, ariaLabel, children, footer },
  ref,
) {
  return (
    <Box
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      data-format={format}
      sx={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT[format],
        boxSizing: 'border-box',
        p: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
        color: shareColors.text,
        bgcolor: shareColors.canvas,
        backgroundImage: `radial-gradient(circle at 85% 12%, ${shareColors.glow}, transparent 50%), radial-gradient(circle at 8% 92%, ${shareColors.glowSoft}, transparent 45%)`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
        <Box component="svg" width={13} height={13} viewBox="0 0 24 24" aria-hidden sx={{ fill: 'none', stroke: shareColors.brand, strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M3 19V6l9 9 9-9v13" />
        </Box>
        <Typography component="span" sx={{ fontSize: 12, fontWeight: 700 }}>menthoros</Typography>
      </Box>
      <Box sx={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</Box>
      {footer}
    </Box>
  );
});
