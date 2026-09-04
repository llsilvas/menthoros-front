import { describe, it, expect } from 'vitest';
import { activeTheme, workoutTypeColor } from './activeTheme';
import { primary as brandLime, semantic } from './tokens';

// Trava os defeitos críticos do refactor premium (consolidado): o palette deve
// eliminar a colisão categoria↔semantic e tirar o lime de readiness/stage.
describe('activeTheme — palette premium consolidado', () => {
  it('readiness 70–89 (good) não usa o lime de marca', () => {
    expect(activeTheme.readiness.good).not.toBe(brandLime[500]);
  });

  it('trainingType não colide com tokens semânticos (danger/warning/success)', () => {
    const semanticHexes = [semantic.danger[500], semantic.warning[500], semantic.success[500]];
    const map = activeTheme.trainingType as Record<string, string>;
    expect(semanticHexes).not.toContain(map.INTERVALADO);
    expect(semanticHexes).not.toContain(map.TEMPO);
    expect(semanticHexes).not.toContain(map.REGENERATIVO);
  });

  it('trainingStage.principal não usa o lime de marca', () => {
    expect(activeTheme.trainingStage.principal).not.toBe(brandLime[500]);
  });

  it('zone Z2 (Base) não usa o lime de marca e preserva o shape estruturado', () => {
    expect(activeTheme.zones.Z2.color).not.toBe(brandLime[500]);
    expect(activeTheme.zones.Z2).toMatchObject({
      color: expect.any(String),
      fill: expect.any(String),
      border: expect.any(String),
      label: 'Base',
    });
  });

  it('workoutTypeColor normaliza caixa e cai no DEFAULT', () => {
    const map = activeTheme.trainingType as Record<string, string>;
    expect(workoutTypeColor('tempo')).toBe(map.TEMPO);
    expect(workoutTypeColor('desconhecido')).toBe(map.DEFAULT);
    expect(workoutTypeColor(undefined)).toBe(map.DEFAULT);
  });

  it('trainingType.PROVA usa o lime de marca (prova-no-plano-semanal, D7)', () => {
    const map = activeTheme.trainingType as Record<string, string>;
    expect(map.PROVA).toBe(brandLime[500]);
    expect(workoutTypeColor('prova')).toBe(map.PROVA);
  });
});
