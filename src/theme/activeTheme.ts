// Seletor de tema ativo — superfície única de consumo de cor pelos componentes.
//
// Sob a feature-flag `premium-v2`, troca os grupos de token que mudam entre a
// paleta atual (`tokens.ts` / `workoutColors.ts`) e a Premium v2.0
// (`theme.premium.ts`). Componentes consomem SEMPRE via `activeTheme` — nunca
// hex raw, nunca importando o grupo flag-aware direto da camada de tokens.
//
// Grupos flag-aware (mudam de valor com a flag):
//   - `colors.primary` (palette MUI) e `primary` (escala 50→900): lime #D4FF3A → #BDDE5A
//   - `sidebar`: lime tint de seleção (#D4FF3A → #BDDE5A)
//   - `glass`: material translúcido (valores coincidem hoje; roteado para consistência)
//   - `trainingStatus`: PARCIAL warning[400] #FBBF24 → warning[500] #F59E0B
//
// Grupos invariantes (idênticos nos dois estados) são apenas re-exportados:
//   text, content, backgrounds, semantic, surface, overlayWhite, overlayBlack.
//
// Os arquivos de token atuais permanecem intactos como fallback do flag OFF —
// a flag é o mecanismo de rollback (não há edição in-place de tokens na Phase 1).
import { isPremiumV2Enabled } from './featureFlags';
import {
  colors,
  text,
  content,
  backgrounds,
  semantic,
  surface,
  primary as currentPrimary,
  sidebar as currentSidebar,
  glass as currentGlass,
} from './tokens';
import {
  primary as premiumPrimary,
  sidebar as premiumSidebar,
  glass as premiumGlass,
} from './theme.premium';
import { WORKOUT_STATUS_COLORS } from '../shared/theme/workoutColors';
import { overlayWhite, overlayBlack } from './overlays';

const enabled = isPremiumV2Enabled();

const premiumColors = {
  ...colors,
  primary: {
    main:         premiumPrimary[500],
    light:        premiumPrimary[400],
    dark:         premiumPrimary[600],
    contrastText: premiumPrimary.contrastText,
  },
} as const;

// trainingStatus OFF = mapa atual completo; ON aplica o delta v2.0 (só PARCIAL
// sai de warning[400] para warning[500]). REALIZADO/CONCLUIDO/PENDENTE/PERDIDO/
// LIVRE são idênticos entre as paletas.
const premiumTrainingStatus: Record<string, string> = {
  ...WORKOUT_STATUS_COLORS,
  PARCIAL: semantic.warning[500],
};

export const activeTheme = {
  // invariantes
  text,
  content,
  backgrounds,
  semantic,
  surface,
  overlayWhite,
  overlayBlack,
  // flag-aware
  colors:         enabled ? premiumColors : colors,
  primary:        enabled ? premiumPrimary : currentPrimary,
  sidebar:        enabled ? premiumSidebar : currentSidebar,
  glass:          enabled ? premiumGlass : currentGlass,
  trainingStatus: enabled ? premiumTrainingStatus : WORKOUT_STATUS_COLORS,
} as const;
