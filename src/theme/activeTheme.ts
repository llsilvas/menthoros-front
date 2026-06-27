// Seletor de tema ativo para o createTheme (App.tsx).
//
// Sob a feature-flag `premium-v2`, troca as primitivas consumidas pelo palette
// MUI entre a paleta atual (`tokens.ts`) e a Premium v2.0 (`theme.premium.ts`).
//
// No nível do createTheme a diferença entre as paletas é a escala `primary`
// (lime suavizado #D4FF3A → #BDDE5A). Os demais inputs do palette
// (text/content/backgrounds/semantic) são idênticos entre as duas paletas — a
// divergência v2.0 restante (categorical/readiness/stage/zone) vive nos tokens
// consumidos pelos componentes e migra nas Phases 1–3.
import { isPremiumV2Enabled } from './featureFlags';
import { colors, text, content, backgrounds, semantic } from './tokens';
import { primary as premiumPrimary } from './theme.premium';

const premiumColors = {
  ...colors,
  primary: {
    main:         premiumPrimary[500],
    light:        premiumPrimary[400],
    dark:         premiumPrimary[600],
    contrastText: premiumPrimary.contrastText,
  },
} as const;

const currentTheme = { colors, text, content, backgrounds, semantic } as const;
const premiumTheme = { colors: premiumColors, text, content, backgrounds, semantic } as const;

export const activeTheme = isPremiumV2Enabled() ? premiumTheme : currentTheme;
