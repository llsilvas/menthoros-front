import { describe, it, expect } from 'vitest';
import { buildAderenciaResumo } from './aderenciaAdapter';

describe('aderenciaAdapter', () => {
  describe('buildAderenciaResumo', () => {
    it('soma totalRealizado e totalPlanejado de todas as semanas', () => {
      const resumo = buildAderenciaResumo([
        { semanaInicio: '2026-06-01', totalPlanejado: 5, totalRealizado: 4, percentual: 80 },
        { semanaInicio: '2026-06-08', totalPlanejado: 6, totalRealizado: 5, percentual: 83 },
      ]);

      expect(resumo).toEqual({ totalRealizado: 9, totalPlanejado: 11 });
    });

    it('retorna null para lista vazia — sem dados, não fabrica "0 de 0"', () => {
      expect(buildAderenciaResumo([])).toBeNull();
    });
  });
});
