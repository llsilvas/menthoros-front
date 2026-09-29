import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { elevation } from '../design-tokens';
import { radius } from '../design-tokens/density';
import { content, glassSx, glassSxHover, semantic, transitions } from '../../theme/tokens';

// PMn = achado da rodada 2 do pré-mortem (Codex, DoR check); CAn = critério de aceite do proposal.
// Ambos documentados em menthoros-product/openspec/changes/standardize-card-foundation/{design,proposal}.md.

export type CardVariant = 'flat' | 'glass';
export type CardStateColor = 'success' | 'danger' | 'warning' | 'info';

const STATE_COLOR_HEX: Record<CardStateColor, string> = {
  success: semantic.success[500],
  danger:  semantic.danger[500],
  warning: semantic.warning[500],
  info:    semantic.info[500],
};

// Opacidade única para o fundo tingido — o app não tinha um valor canônico (TreinoCard usava dois
// valores diferentes por estado, 40/14 em hex, sem critério documentado). Um valor único aqui é
// consistência, não regressão: exatamente o que esta change existe para resolver.
const STATE_BG_OPACITY = 0.16;

export interface BuildCardSxArgs {
  variant: CardVariant;
  /** Já resolvido por quem chama (interactive OR onClick presente) — cardStyles não precisa do handler. */
  isInteractive: boolean;
  stateColor?: CardStateColor;
  padding: 2 | 2.5 | 3;
}

export function buildCardSx({
  variant,
  isInteractive,
  stateColor,
  padding,
}: BuildCardSxArgs): SxProps<Theme> {
  const sx: Record<string, unknown> = {
    borderRadius: radius.lg,
    padding,
    transition: transitions.default,
  };

  if (variant === 'glass') {
    Object.assign(sx, glassSx);
  } else {
    sx.backgroundColor = elevation.card;
    sx.border = `1px solid ${content.cardBorder}`;
  }

  if (stateColor) {
    const hex = STATE_COLOR_HEX[stateColor];
    sx.border = `2px solid ${hex}`;
    sx.backgroundColor = alpha(hex, STATE_BG_OPACITY);
  }

  if (isInteractive) {
    sx.cursor = 'pointer';
    // stateColor tem precedência: hover nunca sobrescreve a cor semântica (PM6).
    if (!stateColor) {
      sx['&:hover'] = variant === 'glass' ? glassSxHover : { backgroundColor: content.cardBgHover };
    }
  }

  return sx as SxProps<Theme>;
}
