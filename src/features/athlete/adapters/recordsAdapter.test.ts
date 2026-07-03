import { describe, it, expect } from 'vitest';
import { formatTempoRecorde, buildRecordRows } from './recordsAdapter';

describe('recordsAdapter', () => {
  describe('formatTempoRecorde', () => {
    it('formata segundos como HH:MM:SS', () => {
      expect(formatTempoRecorde(2730)).toBe('00:45:30');
    });

    it('formata tempos acima de 1 hora', () => {
      expect(formatTempoRecorde(6442)).toBe('01:47:22');
    });

    it('formata zero segundos', () => {
      expect(formatTempoRecorde(0)).toBe('00:00:00');
    });
  });

  describe('buildRecordRows', () => {
    it('mapeia AthleteRecord[] para linhas de exibição com tempo formatado', () => {
      const rows = buildRecordRows([
        { distancia: '10k', tempoSegundos: 2730, data: '2026-05-08', treinoRealizadoId: 'abc' },
      ]);

      expect(rows).toEqual([{ distancia: '10k', tempoFormatado: '00:45:30', data: '2026-05-08' }]);
    });

    it('retorna lista vazia sem inventar recordes', () => {
      expect(buildRecordRows([])).toEqual([]);
    });
  });
});
