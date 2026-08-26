import { describe, expect, it } from 'vitest';
import { buildWeekOverview } from './buildWeekOverview';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import { workoutTypeColor } from '../../../theme/activeTheme';

const HOJE = new Date(2026, 7, 26); // quarta

const plano: PlanoSemanal = {
  atletaId: 'a1', semanaInicio: '2026-08-24', semanaFim: '2026-08-30',
  volumePlanejadoKm: 42, volumeRealizadoKm: 14.5, volumeAlvoKm: 42, status: 'ATIVO',
  treinosPlanejados: [
    { tipoTreino: 'FACIL', distanciaKm: 8, diaSemana: 'SEGUNDA', dataTreino: '2026-08-24', statusTreino: 'REALIZADO' },
    { tipoTreino: 'INTERVALADO', distanciaKm: 7, diaSemana: 'TERCA', dataTreino: '2026-08-25', statusTreino: 'PERDIDO' },
    { tipoTreino: 'FACIL', distanciaKm: 8, diaSemana: 'QUARTA', dataTreino: '2026-08-26', statusTreino: 'PENDENTE' },
    { tipoTreino: 'LONGO', distanciaKm: 15, diaSemana: 'SABADO', dataTreino: '2026-08-29', statusTreino: { value: 'PENDENTE', label: 'Pendente' } },
  ],
};

const treinos = [
  { id: 't1', dataTreino: '2026-08-24', distanciaKm: 7.8 },
  { id: 't2', dataTreino: '2026-08-10', distanciaKm: 10 }, // fora da semana
] as TreinoRealizadoDto[];

describe('buildWeekOverview', () => {
  it('monta os sete dias da semana do plano com status e cor por enum do backend', () => {
    const vm = buildWeekOverview({ plano, treinos, streak: 3, proximaProva: { nomeProva: 'Meia', diasFaltando: 39 }, hoje: HOJE });
    expect(vm.temPlano).toBe(true);
    expect(vm.dias).toHaveLength(7);
    expect(vm.dias.map((d) => d.status)).toEqual(['concluido', 'pulado', 'hoje', 'descanso', 'descanso', 'futuro', 'descanso']);
    expect(vm.dias[0].color).toBe(workoutTypeColor('FACIL'));
    expect(vm.dias[1].color).toBe(workoutTypeColor('INTERVALADO'));
    expect(vm.dias[5].color).toBe(workoutTypeColor('LONGO'));
    expect(vm.dias[3].color).toBeNull();
    expect(vm.volumeRealizadoKm).toBe(14.5);
    expect(vm.volumePlanejadoKm).toBe(42);
    expect(vm.streak).toBe(3);
    expect(vm.proximaProva).toEqual({ nomeProva: 'Meia', diasFaltando: 39 });
  });

  it('sem plano: semana corrente, dias sem status de treino, volume vindo dos treinos realizados', () => {
    const vm = buildWeekOverview({ plano: null, treinos, streak: 0, proximaProva: null, hoje: HOJE });
    expect(vm.temPlano).toBe(false);
    expect(vm.dias).toHaveLength(7);
    expect(vm.dias[0].iso).toBe('2026-08-24');
    expect(vm.dias[2].status).toBe('hoje');
    expect(vm.volumeRealizadoKm).toBe(7.8);
    expect(vm.volumePlanejadoKm).toBeNull();
  });

  it('não inventa cor para tipo desconhecido — usa o neutro do tema', () => {
    const vm = buildWeekOverview({
      plano: { ...plano, treinosPlanejados: [{ tipoTreino: 'XYZ', distanciaKm: 1, diaSemana: 'SEGUNDA', dataTreino: '2026-08-24' }] },
      treinos: [], streak: 0, proximaProva: null, hoje: HOJE,
    });
    expect(vm.dias[0].color).toBe(workoutTypeColor('XYZ'));
  });
});
