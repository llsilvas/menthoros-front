import { describe, it, expect } from 'vitest';
import { timeOfDayNow, buildNextWorkout } from './homeAdapter';
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


  describe('buildNextWorkout', () => {
    it('retorna null sem próximo treino', () => {
      expect(buildNextWorkout(null)).toBeNull();
      expect(buildNextWorkout({})).toBeNull();
    });
    it('usa o rótulo do tipo como título e a descricao como detalhe', () => {
      const home: AthleteHome = { proximoTreino: { tipoTreino: 'LONGO', descricao: 'Longão 18km Z2' } };
      const workout = buildNextWorkout(home);
      expect(workout?.title).toBe('Longo');
      expect(workout?.description).toBe('Longão 18km Z2');
    });

    it('usa a cor canônica do tipo de treino (workoutTypeColor) — mesma fonte do DayCard/Plano', () => {
      const intervalado = buildNextWorkout({ proximoTreino: { tipoTreino: 'INTERVALADO' } });
      const longo = buildNextWorkout({ proximoTreino: { tipoTreino: 'LONGO' } });
      const desconhecido = buildNextWorkout({ proximoTreino: { tipoTreino: 'TIPO_INEXISTENTE' } });

      expect(intervalado?.color).toBeTruthy();
      // Tipos diferentes têm cores diferentes (não fica tudo com a mesma cor neutra)
      expect(intervalado?.color).not.toBe(longo?.color);
      // Tipo desconhecido cai no DEFAULT, não quebra nem fica undefined
      expect(desconhecido?.color).toBeTruthy();
    });
  });

});
