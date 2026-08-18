// Superfície única de consumo de cor pelos componentes.
//
// A paleta Premium v2.0 (`theme.premium.ts`) é a canônica — o lime de marca é
// #BDDE5A e os grupos categóricos não colidem com semantic. Componentes consomem
// SEMPRE via `activeTheme` — nunca hex raw, nunca importando o grupo direto da
// camada de tokens. A antiga feature-flag `premium-v2` foi consolidada (premium
// é a única paleta) e removida.
//
// Grupos premium (montados/roteados aqui):
//   - `colors` (palette MUI) e `primary` (escala 50→900): lime #BDDE5A
//   - `sidebar`, `glass`, `trainingStatus`, `trainingType`, `trainingStage`,
//     `readiness`, `zones`
//
// Grupos invariantes (re-exportados): text, content, backgrounds, semantic,
// surface, overlayWhite, overlayBlack.
import {
  colors,
  text,
  content,
  backgrounds,
  semantic,
  surface,
} from './tokens';
import {
  primary as premiumPrimary,
  sidebar as premiumSidebar,
  glass as premiumGlass,
  surface as premiumSurface,
  trainingType as premiumTrainingType,
  trainingStage as premiumTrainingStage,
  readiness as premiumReadiness,
  zone as premiumZone,
  zoneLabel as ZONE_LABELS,
  workoutZone as premiumWorkoutZone,
  workoutZoneLabel as premiumWorkoutZoneLabel,
  font as premiumFont,
  workoutProfileFill as premiumWorkoutProfileFill,
  workoutProfileChrome as premiumWorkoutProfileChrome,
  workoutProfileType as premiumWorkoutProfileType,
  workoutProfileSpace as premiumWorkoutProfileSpace,
} from './theme.premium';
import { WORKOUT_STATUS_COLORS } from '../shared/theme/workoutColors';
import { overlayWhite, overlayBlack } from './overlays';

const premiumColors = {
  ...colors,
  primary: {
    main:         premiumPrimary[500],
    light:        premiumPrimary[400],
    dark:         premiumPrimary[600],
    contrastText: premiumPrimary.contrastText,
  },
} as const;

const premiumTrainingStatus: Record<string, string> = { ...WORKOUT_STATUS_COLORS };

// trainingType ancora em `categorical` (hues dedicados, sem colisão com semantic).
// premiumTrainingType não tem DEFAULT — adiciona-se um neutro de superfície.
const premiumType: Record<string, string> = {
  ...premiumTrainingType,
  DEFAULT: premiumSurface[500],
};

// zones: shape estruturado (color/fill/border/label) sobre os hexes premium.
// Os rótulos vêm de `theme.premium` (`zoneLabel`) porque `workoutZone` também os
// usa — declarados aqui, seriam duas listas divergindo na primeira renomeação.
const zoneEntry = (color: string, label: string) =>
  ({ color, fill: `${color}2E`, border: color, label }) as const;
const premiumZones = {
  Z1: zoneEntry(premiumZone.Z1, ZONE_LABELS.Z1),
  Z2: zoneEntry(premiumZone.Z2, ZONE_LABELS.Z2),
  Z3: zoneEntry(premiumZone.Z3, ZONE_LABELS.Z3),
  Z4: zoneEntry(premiumZone.Z4, ZONE_LABELS.Z4),
  Z5: zoneEntry(premiumZone.Z5, ZONE_LABELS.Z5),
} as const;

export const activeTheme = {
  // invariantes
  text,
  content,
  backgrounds,
  semantic,
  surface,
  overlayWhite,
  overlayBlack,
  // premium (canônico)
  colors:         premiumColors,
  primary:        premiumPrimary,
  sidebar:        premiumSidebar,
  glass:          premiumGlass,
  trainingStatus: premiumTrainingStatus,
  trainingType:   premiumType,
  trainingStage:  premiumTrainingStage,
  readiness:      premiumReadiness,
  zones:          premiumZones,
  // WorkoutProfile — rampa própria, fria→quente. Não substitui `zones`, que
  // segue servindo os demais gráficos (ver theme.premium, grupo `workoutZone`).
  workoutZone:         premiumWorkoutZone,
  workoutZoneLabel:    premiumWorkoutZoneLabel,
  font:                premiumFont,
  workoutProfileFill:  premiumWorkoutProfileFill,
  workoutProfileChrome: premiumWorkoutProfileChrome,
  workoutProfileType:  premiumWorkoutProfileType,
  workoutProfileSpace: premiumWorkoutProfileSpace,
} as const;

// Re-export ergonômico do mapa de zonas: componentes importam de `theme/activeTheme`
// mantendo o uso `zones[zoneKey]`.
export const zones = activeTheme.zones;

// Resolve a cor do tipo de treino pela superfície única (`activeTheme`),
// normalizando caixa e caindo no neutro DEFAULT.
export function workoutTypeColor(tipo?: string): string {
  const map = activeTheme.trainingType as Record<string, string>;
  return map[(tipo ?? '').toUpperCase()] ?? map.DEFAULT;
}
