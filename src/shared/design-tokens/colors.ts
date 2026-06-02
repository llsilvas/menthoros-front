export const primary = {
  50:  '#F7FFE0',
  100: '#EEFFCC',
  200: '#E1FF9E',
  300: '#D4FF6B',
  400: '#CFFF4D',
  500: '#D4FF3A', // canonical brand lime
  600: '#A8CC2E',
  700: '#7C9923',
  800: '#506617',
  900: '#2A3D0A',
} as const;

export const surface = {
  0:   '#FFFFFF',
  50:  '#F8FAFC',  // text-primary (off-white)
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',  // text-tertiary (muted)
  500: '#64748B',  // text-secondary muted
  600: '#475569',
  700: '#1E293B',  // borders
  800: '#131F35',  // cards, table rows hover
  850: '#0E1B30',  // panels, mid-elevation
  900: '#0A1628',  // navy canonical — canvas base, sidebar
} as const;

export const semantic = {
  danger:  { 300: '#FCA5A5', 500: '#EF4444', 700: '#B91C1C' },
  warning: { 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 700: '#B45309' },
  success: { 500: '#10B981', 700: '#047857' },
  info:    { 500: '#3B82F6', 700: '#1D4ED8' },
} as const;

// Non-semantic palette for categorization (workout types, AI suggestion types, etc.)
export const categorical = {
  cat1: '#3B82F6', // blue     — new_plan, easy_run
  cat2: '#10B981', // emerald  — reserved (avoid confusion with success)
  cat3: '#F59E0B', // amber    — tempo, plan_adjust
  cat4: '#A855F7', // purple   — reserved
  cat5: '#EC4899', // pink     — reserved
  cat6: '#14B8A6', // teal     — race_simulation
  cat7: '#8B5CF6', // violet   — long_run, recovery suggestion
  cat8: '#6B7280', // gray     — combined_session, deload, strength
} as const;

export const colors = { primary, surface, semantic, categorical } as const;

// Readiness score tokens (prontidão do atleta para treino)
export const readiness = {
  low:    semantic.danger[500],    // 0-39
  medium: semantic.warning[500],   // 40-69
  high:   primary[500],            // 70-89
  peak:   semantic.success[500],   // 90-100
} as const;
