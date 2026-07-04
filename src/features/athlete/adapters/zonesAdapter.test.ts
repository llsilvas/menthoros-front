import { describe, it, expect } from 'vitest';
import { buildZoneDistributionPercent } from './zonesAdapter';

describe('zonesAdapter', () => {
  describe('buildZoneDistributionPercent', () => {
    it('converte segundos por zona em percentual do total', () => {
      const result = buildZoneDistributionPercent({ z1: 300, z2: 300, z3: 200, z4: 100, z5: 100, duracaoTotalSegundos: 1000 });

      expect(result).toEqual({ z1: 30, z2: 30, z3: 20, z4: 10, z5: 10 });
    });

    it('retorna null quando duracaoTotalSegundos é zero (sem divisão por zero)', () => {
      const result = buildZoneDistributionPercent({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, duracaoTotalSegundos: 0 });

      expect(result).toBeNull();
    });

    it('arredonda os percentuais para inteiro', () => {
      const result = buildZoneDistributionPercent({ z1: 1, z2: 1, z3: 1, z4: 0, z5: 0, duracaoTotalSegundos: 3 });

      expect(result).toEqual({ z1: 33, z2: 33, z3: 33, z4: 0, z5: 0 });
    });
  });
});
