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

    it('isToday: true quando a data do próximo treino é hoje, false quando é futura', () => {
      const hojeIso = new Date().toISOString().slice(0, 10);
      const hoje = buildNextWorkout({ proximoTreino: { tipoTreino: 'FACIL', data: hojeIso } });
      const futuro = buildNextWorkout({ proximoTreino: { tipoTreino: 'FACIL', data: '2099-01-01' } });
      expect(hoje?.isToday).toBe(true);
      expect(futuro?.isToday).toBe(false);
    });

    it('isToday: false quando o próximo treino não tem data', () => {
      const workout = buildNextWorkout({ proximoTreino: { tipoTreino: 'FACIL' } });
      expect(workout?.isToday).toBe(false);
    });

    it('monta o perfil pelo mesmo caminho do drawer do Plano: bloco 2× ganha repeat com total 2 e índice por posição', () => {
      const workout = buildNextWorkout({
        proximoTreino: {
          tipoTreino: 'INTERVALADO', descricao: '2x(4/2)', duracaoMin: 45, zonaAlvo: 'Z4', tssPlanejado: 70, intensidadePlanejada: 0.95,
          etapas: [
            { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10 },
            { ordem: 2, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
            { ordem: 3, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
            { ordem: 4, tipoEtapa: 'ESFORCO', duracaoMin: 4, blocoId: 'b1', blocoRepeticoes: 2 },
            { ordem: 5, tipoEtapa: 'RECUPERACAO', duracaoMin: 2, blocoId: 'b1', blocoRepeticoes: 2 },
          ],
        },
      })!;
      expect(workout.estimatedDuration).toBe(45);
      expect(workout.profile).toBeDefined();
      const repeats = workout.profile!.blocks.filter((b) => b.repeat);
      expect(repeats).toHaveLength(4);
      expect(repeats.map((b) => b.repeat!.index)).toEqual([1, 1, 2, 2]);
      expect(repeats.every((b) => b.repeat!.total === 2)).toBe(true);
    });

    it('sem etapas: sem perfil (nada de placeholder), duração ausente quando não prescrita', () => {
      const workout = buildNextWorkout({ proximoTreino: { tipoTreino: 'FACIL', descricao: 'Trote' } })!;
      expect(workout.profile).toBeUndefined();
      expect(workout.estimatedDuration).toBeUndefined();
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
