import { alpha } from '@mui/material/styles';
import { primary, surface } from '../../../../theme/tokens';
import { font, glass } from '../../../../theme/theme.premium';
import type { ShareFormat } from '../../types/ShareCard';

/**
 * Os cards são autorados em 360 px de largura e exportados com `pixelRatio: 3` (→ 1080 px):
 * uma única árvore serve de prévia e de fonte da imagem (design D5).
 */
export const SHARE_CARD_WIDTH = 360;
export const SHARE_EXPORT_PIXEL_RATIO = 3;

export const SHARE_CARD_HEIGHT: Record<ShareFormat, number> = {
  story: 640,
  feed: 450,
  quadrado: 360,
};

export const shareColors = {
  canvas: surface[900],
  text: surface[50],
  textSecondary: surface[300],
  brand: primary[500],
  glow: alpha(primary[500], 0.2),
  glowSoft: alpha(primary[500], 0.08),
  glassBg: glass.background,
  glassBorder: glass.border,
} as const;

/** Número grande condensado e itálico (v2 · Kinetic). */
export const displayNumberSx = {
  fontFamily: font.displayShare,
  fontStyle: 'italic',
  fontWeight: 800,
  lineHeight: 0.8,
  letterSpacing: '-0.03em',
} as const;

export const monoSx = { fontFamily: font.mono, fontWeight: 700 } as const;

export const labelSx = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: shareColors.textSecondary,
} as const;

/** Vidro dos blocos; no modo de exportação fica opaco (sem backdrop-filter, design D5). */
export const glassBlockSx = {
  bgcolor: shareColors.glassBg,
  border: `1px solid ${shareColors.glassBorder}`,
  borderRadius: '18px',
} as const;
