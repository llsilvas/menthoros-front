import { describe, it, expect } from 'vitest';
import { categorical, surface, surfaceShift } from './theme.premium';
// A mesma aritmética que o runtime usa para verificar a rampa `workoutZone`.
// Reimplementá-la aqui daria um teste de contraste que passa mesmo se a função
// de produção estiver errada.
import { contrastRatio } from './colorMath';

// CA (refactor-color-system-premium-v2, task 2.8): matriz de contraste WCAG
// dos categóricos v2.0 contra os 4 fundos de elevação. Texto ≥4.5:1 (AA);
// UI/borda ≥3:1. `PlanoDetalhePanel.tsx` usa `workoutTypeColor()` (que
// resolve para `categorical.*`) como cor de texto direta (hero number +
// label do tipo de treino) — por isso o piso aplicado aqui é sempre o mais
// estrito (4.5:1), que cobre automaticamente o caso UI/borda (3:1).
//
// `injuryResponse` fica de fora: é alias declarado de `semantic.danger`
// (âncora estável, inalterada por esta change — não é um "novo categórico").

const NEW_CATEGORICALS: Record<string, string> = {
  slate: categorical.slate,
  teal: categorical.teal,
  cyan: categorical.cyan,
  violet: categorical.violet,
  magenta: categorical.magenta,
  coral: categorical.coral,
  gold: categorical.gold,
  sage: categorical.sage,
};

const ELEVATION_BACKGROUNDS: Record<string, string> = {
  'surface.900': surface[900],
  'surfaceShift.panel': surfaceShift.panel,
  'surfaceShift.card': surfaceShift.card,
  'surfaceShift.raised': surfaceShift.raised,
};

const AA_TEXT_MIN = 4.5;

describe('theme.premium — matriz de contraste WCAG dos categóricos (task 2.8)', () => {
  for (const [colorName, hex] of Object.entries(NEW_CATEGORICALS)) {
    for (const [bgName, bgHex] of Object.entries(ELEVATION_BACKGROUNDS)) {
      it(`categorical.${colorName} vs ${bgName} atinge AA texto (≥${AA_TEXT_MIN}:1)`, () => {
        const ratio = contrastRatio(hex, bgHex);
        expect(ratio, `${colorName} (${hex}) vs ${bgName} (${bgHex}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA_TEXT_MIN);
      });
    }
  }
});
