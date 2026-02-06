/**
 * Design Tokens - Menthoros Dashboard
 *
 * Paleta azul gradient com efeitos glassmorphism.
 * Todos os tokens centralizados aqui para consistencia.
 */

// ── Cores principais ──────────────────────────────────────────────
export const colors = {
  primary: {
    main: '#0e3147',
    dark: '#082130',
    light: '#1a4a66',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#b1e92d',
    light: '#c5f05a',
    dark: '#8bc120',
    contrastText: '#0e3147',
  },
} as const;

// ── Gradientes ────────────────────────────────────────────────────
export const gradients = {
  background: 'linear-gradient(135deg, #082130 0%, #0e3147 50%, #1a4a66 100%)',
  sidebar: 'linear-gradient(180deg, #082130 0%, #0e3147 100%)',
  header: 'linear-gradient(90deg, #082130 0%, #0e3147 100%)',
} as const;

// ── Glassmorphism ─────────────────────────────────────────────────
export const glass = {
  background: 'rgba(255, 255, 255, 0.40)',
  backgroundHover: 'rgba(255, 255, 255, 0.48)',
  backgroundActive: 'rgba(255, 255, 255, 0.55)',
  border: 'rgba(255, 255, 255, 0.22)',
  borderHover: 'rgba(255, 255, 255, 0.81)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
} as const;

// ── Textos ────────────────────────────────────────────────────────
export const text = {
  primary: '#082130',
  secondary: '#0e3147',
  muted: 'rgba(14, 49, 71, 0.7)',
  disabled: 'rgba(14, 49, 71, 0.38)',
  icon: '#0e3147',
  iconMuted: 'rgba(14, 49, 71, 0.6)',
} as const;

// ── Sidebar ───────────────────────────────────────────────────────
export const sidebar = {
  text: '#a4cff3',
  textHover: '#ffffff',
  selectedBg: 'rgba(177, 233, 45, 0.15)',
  selectedBorder: '#b1e92d',
  selectedIcon: '#b1e92d',
  hoverBg: 'rgba(255, 255, 255, 0.08)',
  headerColor: '#b1e92d',
  divider: 'rgba(255, 255, 255, 0.12)',
} as const;

// ── Componentes de conteudo ───────────────────────────────────────
export const content = {
  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBgHover: 'rgba(255, 255, 255, 0.12)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  inputBorderFocus: 'rgba(255, 255, 255, 0.4)',
  divider: 'rgba(255, 255, 255, 0.12)',
  tableBgHover: 'rgba(255, 255, 255, 0.04)',
} as const;

// ── Transicoes ────────────────────────────────────────────────────
export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
} as const;

// ── Bordas ────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

// ── Helper: aplica glassmorphism via sx ───────────────────────────
export const glassSx = {
  backgroundColor: glass.background,
  backdropFilter: glass.backdropFilter,
  WebkitBackdropFilter: glass.backdropFilter,
  border: `1px solid ${glass.border}`,
  boxShadow: glass.boxShadow,
} as const;

export const glassSxHover = {
  backgroundColor: glass.backgroundHover,
  border: `1px solid ${glass.borderHover}`,
} as const;
