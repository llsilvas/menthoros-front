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

    it('arredonda para inteiro e fecha em 100: a diferença do arredondamento vai para a maior zona', () => {
      // 33+33+33 = 99 → a primeira das maiores (empate) absorve o resto.
      const result = buildZoneDistributionPercent({ z1: 1, z2: 1, z3: 1, z4: 0, z5: 0, duracaoTotalSegundos: 3 });

      expect(result).toEqual({ z1: 34, z2: 33, z3: 33, z4: 0, z5: 0 });
    });

    it('não mexe quando já soma 100', () => {
      expect(buildZoneDistributionPercent({ z1: 12, z2: 62, z3: 10, z4: 13, z5: 3, duracaoTotalSegundos: 100 }))
        .toEqual({ z1: 12, z2: 62, z3: 10, z4: 13, z5: 3 });
    });
  });
});
