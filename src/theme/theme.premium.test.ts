import { describe, it, expect } from 'vitest';
import {
  trainingType,
  trainingStage,
  readiness,
  zone,
  zoneLabel,
  workoutZone,
  workoutZoneLabel,
  categorical,
  surfaceShift,
  premiumTokens,
} from './theme.premium';
import { contrastRatio, hueOf } from './colorMath';

// CA3 (refactor-color-system-premium-v2): a regra de não-colisão vale entre
// CATEGORIAS (trainingType/trainingStage) e semantic — não entre ESTADO
// (readiness/zone/trainingStatus) e semantic. readiness e zone ancoram bandas
// de risco/intensidade em semantic de propósito (ver design.md); só a banda
// "boa" de cada um (readiness.good, zone.Z2) precisava sair do lime — CA2.
const SEMANTIC_HEXES = Object.values(premiumTokens.semantic);

describe('theme.premium — CA3: trainingType/trainingStage sem colisão com semantic', () => {
  it.each(Object.entries(trainingType))('trainingType.%s não compartilha hex com semantic', (_tipo, hex) => {
    expect(SEMANTIC_HEXES).not.toContain(hex);
  });

  it.each(Object.entries(trainingStage))('trainingStage.%s não compartilha hex com semantic', (_etapa, hex) => {
    expect(SEMANTIC_HEXES).not.toContain(hex);
  });

  it('categorical.injuryResponse é a única exceção declarada — igual a semantic.danger de propósito', () => {
    expect(categorical.injuryResponse).toBe(premiumTokens.semantic.danger);
  });

  it('fora de injuryResponse, nenhum categorical dedicado colide com semantic', () => {
    for (const [key, hex] of Object.entries(categorical)) {
      if (key === 'injuryResponse') continue;
      expect(SEMANTIC_HEXES, `categorical.${key}`).not.toContain(hex);
    }
  });
});

describe('theme.premium — readiness/zone: reuso intencional de semantic (estado, não categoria)', () => {
  it('readiness ancora bandas de risco/sucesso em semantic de propósito', () => {
    expect(readiness.critical).toBe(premiumTokens.semantic.danger);
    expect(readiness.caution).toBe(premiumTokens.semantic.warning);
    expect(readiness.optimal).toBe(premiumTokens.semantic.success);
  });

  it('readiness.good não usa lime nem semantic — teal dedicado', () => {
    expect(readiness.good).not.toBe(premiumTokens.primary[500]);
    expect(SEMANTIC_HEXES).not.toContain(readiness.good);
  });

  it('zone heat ramp ancora Z3-Z5 em semantic de propósito', () => {
    expect(zone.Z3).toBe(premiumTokens.semantic.info);
    expect(zone.Z4).toBe(premiumTokens.semantic.warning);
    expect(zone.Z5).toBe(premiumTokens.semantic.danger);
  });

  it('zone.Z2 não usa lime — green dedicado', () => {
    expect(zone.Z2).not.toBe(premiumTokens.primary[500]);
  });
});

// ── AC-9 (refactor-workout-profile-chart): a rampa `workoutZone` ─────────────
// `zone` é não-monotônico — Z1 cinza, e Z3 azul entre o verde do Z2 e o âmbar do
// Z4. É o defeito D9 da spec do WorkoutProfile: a cor deixa de reforçar a leitura
// "mais forte" e passa a contradizê-la. `workoutZone` é um grupo NOVO, frio →
// quente; `zone` fica intocado porque outros gráficos o consomem e trocá-lo em
// silêncio quebraria a leitura deles sem aviso.
describe('theme.premium — AC-9: workoutZone é uma rampa monotônica e legível', () => {
  const ORDEM = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const;

  it('percorre o arco ciano → vermelho sem inversão de matiz', () => {
    const matizes = ORDEM.map((z) => hueOf(workoutZone[z]));
    // ≈199 → 160 → 51 → 25 → 0: estritamente decrescente.
    for (let i = 1; i < matizes.length; i++) {
      expect(
        matizes[i],
        `${ORDEM[i]} (${matizes[i].toFixed(0)}°) deveria ser mais quente que ${ORDEM[i - 1]} (${matizes[i - 1].toFixed(0)}°)`,
      ).toBeLessThan(matizes[i - 1]);
    }
  });

  // 3:1 é o piso de componente de UI (WCAG 1.4.11). O que carrega esse contraste
  // no bloco é o cap sólido de 2px e o contorno de 1px, ambos a 100% — não a base
  // do gradiente, que é preenchimento decorativo (§7.3 da spec).
  it.each(ORDEM)('workoutZone.%s tem contraste ≥ 3:1 contra o fundo do plot', (z) => {
    const ratio = contrastRatio(workoutZone[z], surfaceShift.panel);
    expect(
      ratio,
      `${z} (${workoutZone[z]}) vs panel (${surfaceShift.panel}) = ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(3);
  });

  it('não muta o grupo `zone`, consumido por outros gráficos', () => {
    expect(zone.Z1).toBe('#C8CDD4');
    expect(zone.Z3).toBe(premiumTokens.semantic.info);
    expect(workoutZone.Z1).not.toBe(zone.Z1);
    expect(workoutZone.Z3).not.toBe(zone.Z3);
  });

  it('reusa os rótulos de zona em vez de declarar um segundo conjunto', () => {
    expect(workoutZoneLabel).toBe(zoneLabel);
  });
});
