import { describe, expect, it } from 'vitest';
import { buildWeekAgenda } from './buildWeekAgenda';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';

/**
 * show-descanso-no-plano, CA4: a agenda passa a ter dois estados diferentes para um dia sem treino
 * — **descanso prescrito** pela IA e **dia vazio**. Antes os dois eram o mesmo `status: 'descanso'`.
 */
describe('buildWeekAgenda — descanso prescrito', () => {
    // 2026-09-21 é segunda; quinta = 2026-09-24
    const plano = (restDays?: PlanoSemanal['restDays']): PlanoSemanal =>
        ({
            id: 'p1',
            atletaId: 'a1',
            semanaInicio: '2026-09-21',
            semanaFim: '2026-09-27',
            volumePlanejadoKm: 10,
            volumeRealizadoKm: 0,
            volumeAlvoKm: 10,
            status: 'PLANEJADO',
            treinosPlanejados: [],
            restDays,
        }) as PlanoSemanal;

    const diaDe = (agenda: ReturnType<typeof buildWeekAgenda>, iso: string) =>
        agenda.dias.find((d) => d.iso === iso)!;

    it('marca o dia prescrito como descanso da IA', () => {
        const agenda = buildWeekAgenda(plano([{ dayOfWeek: 'QUINTA', reason: 'TSB -11,8' }]));

        expect(diaDe(agenda, '2026-09-24').descansoPrescrito).toBe(true);
    });

    it('CA4: dia sem treino e sem descanso prescrito NÃO é descanso da IA', () => {
        const agenda = buildWeekAgenda(plano([{ dayOfWeek: 'QUINTA', reason: 'TSB -11,8' }]));

        expect(diaDe(agenda, '2026-09-22').descansoPrescrito).toBe(false);
    });

    it.each([[undefined], [null], [[]]])('CA2: restDays %s não marca nenhum dia', (restDays) => {
        const agenda = buildWeekAgenda(plano(restDays as never));

        expect(agenda.dias.every((d) => d.descansoPrescrito === false)).toBe(true);
    });

    it('não vaza o texto técnico do backend para a agenda', () => {
        const agenda = buildWeekAgenda(plano([{ dayOfWeek: 'QUINTA', reason: 'TSB -11,8 (limiar -25)' }]));

        expect(JSON.stringify(agenda)).not.toContain('limiar');
    });

    it('dia de descanso inválido é ignorado sem quebrar a semana', () => {
        const agenda = buildWeekAgenda(plano([{ dayOfWeek: 'FUNDAY', reason: 'x' }]));

        expect(agenda.dias).toHaveLength(7);
        expect(agenda.dias.every((d) => d.descansoPrescrito === false)).toBe(true);
    });
});
