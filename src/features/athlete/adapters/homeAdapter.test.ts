import { describe, it, expect } from 'vitest';
import { timeOfDayNow, homeWorkoutType, buildNextWorkout, buildHomeMetrics } from './homeAdapter';
import type { AthleteHome } from '../../../types/AthleteHome';

describe('homeAdapter', () => {
  describe('timeOfDayNow', () => {
    it('mapeia faixas do relógio', () => {
      expect(timeOfDayNow(8)).toBe('morning');
      expect(timeOfDayNow(14)).toBe('afternoon');
      expect(timeOfDayNow(20)).toBe('evening');
      expect(timeOfDayNow(23)).toBe('night');
      expect(timeOfDayNow(3)).toBe('night');
    });
  });

  describe('homeWorkoutType', () => {
    it('mapeia tipoTreino do próximo treino', () => {
      expect(homeWorkoutType({ proximoTreino: { tipoTreino: 'INTERVALADO' } })).toBe('intervals');
    });
    it('default seguro sem próximo treino', () => {
      expect(homeWorkoutType(null)).toBe('easy_run');
      expect(homeWorkoutType({})).toBe('easy_run');
    });
  });

  describe('buildNextWorkout', () => {
    it('retorna null sem próximo treino', () => {
      expect(buildNextWorkout(null)).toBeNull();
      expect(buildNextWorkout({})).toBeNull();
    });
    it('usa o rótulo do tipo como título e a descricao como detalhe', () => {
      const home: AthleteHome = { proximoTreino: { tipoTreino: 'LONGO', descricao: 'Longão 18km Z2' } };
      expect(buildNextWorkout(home)).toEqual({ title: 'Longo', description: 'Longão 18km Z2' });
    });
  });

  describe('buildHomeMetrics', () => {
    it('mapeia tss/ctl/tsb/atl e formata forma com sinal', () => {
      const metrics = buildHomeMetrics({ tss: 62, ctl: 74.4, tsb: 3.2, atl: 71.1 });
      expect(metrics.map((m) => m.value)).toEqual(['62', '74', '+3', '71']);
    });
    it('mostra — para valores ausentes, nunca fabrica', () => {
      const metrics = buildHomeMetrics(undefined);
      expect(metrics.every((m) => m.value === '—')).toBe(true);
    });
    it('forma negativa mantém o sinal', () => {
      expect(buildHomeMetrics({ tsb: -8 })[2].value).toBe('-8');
    });
  });
});
