import { describe, it, expect } from 'vitest';
import { trainingType, trainingStage, readiness, zone, categorical, premiumTokens } from './theme.premium';

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
