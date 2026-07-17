import { describe, it, expect } from 'vitest';
import { categorical, surface, surfaceShift } from './theme.premium';

// CA (refactor-color-system-premium-v2, task 2.8): matriz de contraste WCAG
// dos categóricos v2.0 contra os 4 fundos de elevação. Texto ≥4.5:1 (AA);
// UI/borda ≥3:1. `PlanoDetalhePanel.tsx` usa `workoutTypeColor()` (que
// resolve para `categorical.*`) como cor de texto direta (hero number +
// label do tipo de treino) — por isso o piso aplicado aqui é sempre o mais
// estrito (4.5:1), que cobre automaticamente o caso UI/borda (3:1).
//
// `injuryResponse` fica de fora: é alias declarado de `semantic.danger`
// (âncora estável, inalterada por esta change — não é um "novo categórico").

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

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
