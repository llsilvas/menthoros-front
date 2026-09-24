import type { SxProps, Theme } from '@mui/material/styles';
import { elevation } from '../../../shared/design-tokens';
import { content } from '../../../theme/tokens';

/**
 * Container comum dos banners do slot acima da `AthleteBottomNav` (instalação, hint iOS, offline):
 * mesma família visual, um único lugar pra mudar. Extraído na 3ª ocorrência (QA da change
 * add-athlete-pwa-ux-hints).
 */
const base = {
  flexShrink: 0,
  px: 2,
  py: 1,
  bgcolor: elevation.panel,
  borderTop: `1px solid ${content.divider}`,
} as const;

export const shellBannerSx: SxProps<Theme> = base;

/** Variante com texto + ações em linha (banners que têm botão). */
export const shellBannerRowSx: SxProps<Theme> = {
  ...base,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};
