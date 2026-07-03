import { describe, it, expect } from 'vitest';
import { buildWeeklyPlan, weekDatesFromInicio } from './buildWeeklyPlan';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';

describe('weekDatesFromInicio', () => {
  it('gera 7 dias consecutivos a partir da segunda', () => {
    const dias = weekDatesFromInicio('2026-06-29'); // segunda
    expect(dias).toHaveLength(7);
    expect(dias[0].getDate()).toBe(29);
    expect(dias[6].getDate()).toBe(5); // domingo 2026-07-05
    expect(dias[6].getMonth()).toBe(6); // julho (0-indexed)
  });
});

describe('buildWeeklyPlan', () => {
  const weekDates = weekDatesFromInicio('2026-06-29');

  function planoCom(treinos: PlanoSemanal['treinosPlanejados']): PlanoSemanal {
    return {
      atletaId: 'a1', semanaInicio: '2026-06-29', semanaFim: '2026-07-05',
      volumePlanejadoKm: 40, volumeRealizadoKm: 20, volumeAlvoKm: 45, status: 'ATIVO',
      treinosPlanejados: treinos,
    };
  }

  it('plano nulo → 7 dias de descanso (workout null)', () => {
    const semana = buildWeeklyPlan(null, weekDates);
    expect(semana).toHaveLength(7);
    expect(semana.every((d) => d.workout === null)).toBe(true);
  });

  it('mapeia treino por dataTreino, tipo, tss, duração e status', () => {
    const plano = planoCom([
      { tipoTreino: 'INTERVALADO', distanciaKm: 10, dataTreino: '2026-07-01', descricao: '6x1km',
        tssPlanejado: 90, duracaoMin: '01:05:00', statusTreino: 'PENDENTE', diaSemana: 'QUARTA' },
      { tipoTreino: 'LONGO', distanciaKm: 28, dataTreino: '2026-07-05', descricao: 'Longão',
        tssPlanejado: 140, duracaoMin: '02:30:00', statusTreino: 'REALIZADO', diaSemana: 'DOMINGO' },
    ]);
    const semana = buildWeeklyPlan(plano, weekDates);

    const qua = semana[2]; // 2026-07-01
    expect(qua.workout?.type).toBe('intervals');
    expect(qua.workout?.title).toBe('Intervalado');
    expect(qua.workout?.estimatedTSS).toBe(90);
    expect(qua.workout?.durationMinutes).toBe(65);
    expect(qua.completionStatus).toBe('pending');

    const dom = semana[6]; // 2026-07-05
    expect(dom.workout?.type).toBe('long_run');
    expect(dom.completionStatus).toBe('completed'); // REALIZADO

    // dias sem treino = descanso
    expect(semana[0].workout).toBeNull();
  });

  it('mapeia PERDIDO para skipped (D0.4)', () => {
    const plano = planoCom([
      { tipoTreino: 'FACIL', distanciaKm: 8, dataTreino: '2026-06-29', descricao: 'Leve',
        tssPlanejado: 40, duracaoMin: 45, statusTreino: 'PERDIDO', diaSemana: 'SEGUNDA' },
    ]);
    const semana = buildWeeklyPlan(plano, weekDates);
    expect(semana[0].completionStatus).toBe('skipped');
    expect(semana[0].workout?.durationMinutes).toBe(45); // duração numérica direta
  });
});
