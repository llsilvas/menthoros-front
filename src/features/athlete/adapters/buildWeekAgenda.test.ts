import { describe, expect, it } from 'vitest';
import { buildWeekAgenda, weekDatesFromInicio } from './buildWeekAgenda';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import { workoutTypeColor } from '../../../theme/activeTheme';

const HOJE = new Date(2026, 7, 26); // quarta

const plano: PlanoSemanal = {
  atletaId: 'a1', semanaInicio: '2026-08-24', semanaFim: '2026-08-30',
  volumePlanejadoKm: 42, volumeRealizadoKm: 14.5, volumeAlvoKm: 42, status: 'ATIVO',
  treinosPlanejados: [
    { tipoTreino: 'FACIL', distanciaKm: 8, duracaoMin: 45, diaSemana: 'SEGUNDA', dataTreino: '2026-08-24', statusTreino: 'REALIZADO', descricao: 'Trote', zonaAlvo: 'Z2' } as never,
    { tipoTreino: 'INTERVALADO', distanciaKm: 0, duracaoMin: '50 min', diaSemana: 'TERCA', dataTreino: '2026-08-25', statusTreino: 'PERDIDO', ritmoAlvo: '5:00 min/km', etapas: [{ tipoEtapa: 'AQUECIMENTO', duracaoMin: 10 }] } as never,
    { tipoTreino: 'FACIL', distanciaKm: 0, duracaoMin: 45, diaSemana: 'QUARTA', dataTreino: '2026-08-26', statusTreino: { value: 'PENDENTE', label: 'Pendente' } } as never,
    { tipoTreino: 'LONGO', distanciaKm: 15, duracaoMin: 90, diaSemana: 'SABADO', dataTreino: '2026-08-29', statusTreino: 'PENDENTE' } as never,
  ],
};

describe('buildWeekAgenda', () => {
  it('sete linhas, status por dia, cor por enum do backend, hoje expandido', () => {
    const agenda = buildWeekAgenda(plano, HOJE);
    expect(agenda.dias).toHaveLength(7);
    expect(agenda.dias.map((d) => d.status)).toEqual(['concluido', 'pulado', 'hoje', 'descanso', 'descanso', 'futuro', 'descanso']);
    expect(agenda.contemHoje).toBe(true);
    expect(agenda.diaDaSemana).toBe(3);
    expect(agenda.dias[0].workout?.color).toBe(workoutTypeColor('FACIL'));
    expect(agenda.dias[1].workout?.color).toBe(workoutTypeColor('INTERVALADO'));
    expect(agenda.dias[3].workout).toBeNull();
  });

  it('distância: prescrita > derivada de duração × pace > ausente; nunca fabrica', () => {
    const [seg, ter, qua] = buildWeekAgenda(plano, HOJE).dias;
    expect(seg.workout?.distanceKm).toBe(8);                 // prescrita
    expect(ter.workout?.distanceKm).toBe(10);                // 50 min ÷ 5:00 min/km
    expect(ter.workout?.distanceEstimated).toBe(true);
    expect(qua.workout?.distanceKm).toBeUndefined();         // sem pace, sem distância
  });

  it('duração aceita número e "50 min"; etapas marcadas por treino', () => {
    const [seg, ter] = buildWeekAgenda(plano, HOJE).dias;
    expect(seg.workout?.durationMin).toBe(45);
    expect(ter.workout?.durationMin).toBe(50);
    expect(seg.workout?.temEtapas).toBe(false);
    expect(ter.workout?.temEtapas).toBe(true);
  });

  it('plano de outra semana (aprovado adiantado): nenhum dia é "hoje" e contemHoje é false', () => {
    const agenda = buildWeekAgenda({ ...plano, semanaInicio: '2026-08-31', semanaFim: '2026-09-06', treinosPlanejados: [] }, HOJE);
    expect(agenda.contemHoje).toBe(false);
    expect(agenda.dias.every((d) => d.status !== 'hoje')).toBe(true);
    expect(agenda.diaDaSemana).toBeNull();
  });

  it('treinos feitos: contagem de realizados sobre os planejados (descanso não conta)', () => {
    const agenda = buildWeekAgenda(plano, HOJE);
    expect(agenda.treinosFeitos).toBe(1);
    expect(agenda.treinosPlanejados).toBe(4);
  });

  it('weekDatesFromInicio gera segunda→domingo em horário local', () => {
    const dias = weekDatesFromInicio('2026-08-24');
    expect(dias[0].getDate()).toBe(24);
    expect(dias[6].getDate()).toBe(30);
  });
});
