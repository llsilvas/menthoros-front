import { primary, semantic, surface, content } from '../../../theme/tokens';

export const ACTION_BTN_SX = {
  textTransform: 'none' as const,
  fontSize: { xs: '0.72rem', xl: '0.8125rem' },
};

export const ACTION_BTN_START_ICON_SX = {
  ...ACTION_BTN_SX,
  px: { xs: 0.85, xl: 1.5 },
  '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
};

export const ACTION_BTN_END_ICON_SX = {
  ...ACTION_BTN_SX,
  px: { xs: 0.85, xl: 1.5 },
  '& .MuiButton-endIcon': { display: { xs: 'none', xl: 'inherit' } },
};

// ── Papéis canônicos de botão (variant="contained", exceto GHOST) ─────────────
// Convenção de hover: primário clareia (primary[400]); semânticos escurecem ([700]).

/** Ação afirmativa principal (CTA): lime sobre navy. */
export const PRIMARY_BTN_SX = {
  textTransform: 'none' as const,
  bgcolor: primary[500],
  color: surface[900],
  fontWeight: 700,
  '&:hover': { bgcolor: primary[400] },
} as const;

/** Ação positiva/confirmação de estado (ex.: marcar oficial): verde sobre navy. */
export const SUCCESS_BTN_SX = {
  textTransform: 'none' as const,
  bgcolor: semantic.success[500],
  color: surface[900],
  fontWeight: 700,
  '&:hover': { bgcolor: semantic.success[700] },
} as const;

/** Ação destrutiva/irreversível: vermelho. */
export const DANGER_BTN_SX = {
  textTransform: 'none' as const,
  bgcolor: semantic.danger[500],
  color: surface[50],
  fontWeight: 700,
  '&:hover': { bgcolor: semantic.danger[700] },
} as const;

/** Ação secundária/cancelar: texto discreto. */
export const GHOST_BTN_SX = {
  textTransform: 'none' as const,
  color: surface[400],
  '&:hover': { color: surface[50], bgcolor: content.cardBgHover },
} as const;
