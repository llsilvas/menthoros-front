import { primary, surface, elevation } from '../shared/design-tokens';

export { primary, surface, semantic, categorical, external } from '../shared/design-tokens';

// ── MUI theme palette values ──────────────────────────────────────────────────
export const colors = {
  primary: {
    main:         primary[500],  // #BDDE5A — brand lime
    light:        primary[400],
    dark:         primary[600],
    contrastText: surface[900],  // navy on lime buttons
  },
  secondary: {
    main:         surface[700],
    light:        surface[600],
    dark:         surface[800],
    contrastText: surface[50],
  },
} as const;

// ── Text hierarchy (dark-first) ───────────────────────────────────────────────
export const text = {
  primary:   surface[50],   // #F8FAFC — off-white
  secondary: surface[400],  // #94A3B8 — muted
  muted:     surface[500],  // #64748B
  disabled:  surface[600],  // #475569
  icon:      surface[400],
  iconMuted: surface[500],
} as const;

// ── Surface backgrounds ───────────────────────────────────────────────────────
export const backgrounds = {
  canvas:  elevation.base,    // #0A1628 — page canvas
  panel:   elevation.panel,   // #0E1B30 — side panels
  card:    elevation.card,    // #131F35 — cards
  highest: elevation.highest, // #1A2940 — modals, dropdowns
} as const;

// ── Sidebar ───────────────────────────────────────────────────────────────────
export const sidebar = {
  text:           surface[400],            // muted
  textHover:      surface[50],             // off-white
  selectedBg:     `${primary[500]}26`,     // lime 15% opacity
  selectedBorder: primary[500],            // canonical lime
  selectedIcon:   primary[500],
  hoverBg:        `${surface[0]}14`,       // white 8%
  headerColor:    primary[500],
  divider:        `${surface[0]}1F`,       // white 12%
} as const;

// ── Card / content ────────────────────────────────────────────────────────────
export const content = {
  cardBg:           `${surface[0]}14`,     // white 8%
  cardBgHover:      `${surface[0]}1F`,     // white 12%
  cardBorder:       `${surface[0]}26`,     // white 15%
  inputBg:          `${surface[0]}0F`,     // white 6%
  inputBorder:      `${surface[0]}33`,     // white 20%
  inputBorderFocus: `${surface[0]}66`,     // white 40%
  divider:          `${surface[0]}1F`,     // white 12%
  tableBgHover:     `${surface[0]}0A`,     // white 4%
} as const;

// ── Gradients (minimal — prefer flat bg-shift for elevation) ──────────────────
export const gradients = {
  // Kept only for sidebar which uses a subtle gradient per nav convention
  sidebar: `linear-gradient(180deg, ${surface[900]} 0%, ${surface[850]} 100%)`,
  header:  surface[900],
  // background is now flat dark canvas (no gradient)
  background: surface[900],
} as const;

// ── Transitions ───────────────────────────────────────────────────────────────
export const transitions = {
  default: 'all 0.3s ease',
  fast:    'all 0.15s ease',
} as const;

// ── Border radius (numeric px for MUI, string for CSS) ───────────────────────
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

// ── Zone key — chaves Z1–Z5. Valores de cor vivem em `theme.premium.ts`,
// consumidos via `activeTheme.zones` — não duplicar mapa de cor aqui.
export type ZoneKey = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

// ── Glass helpers — dark glass only (not white glass) ────────────────────────
export const glass = {
  background:      `${surface[0]}14`,    // white 8%
  backgroundHover: `${surface[0]}1F`,    // white 12%
  backgroundActive:`${surface[0]}26`,    // white 15%
  border:          `${surface[0]}26`,    // white 15%
  borderHover:     `${surface[0]}40`,    // white 25%
  backdropFilter:  'blur(10px)',
  boxShadow:       '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
} as const;

export const glassSx = {
  backgroundColor:       glass.background,
  backdropFilter:        glass.backdropFilter,
  WebkitBackdropFilter:  glass.backdropFilter,
  border:                `1px solid ${glass.border}`,
  boxShadow:             glass.boxShadow,
} as const;

export const glassSxHover = {
  backgroundColor: glass.backgroundHover,
  border:          `1px solid ${glass.borderHover}`,
} as const;

// glassAzulSx kept as alias of glassSx for backward compat (same appearance)
export const glassAzulSx    = glassSx;
export const glassAzulSxHover = glassSxHover;
