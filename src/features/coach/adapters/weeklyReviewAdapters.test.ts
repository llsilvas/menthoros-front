import { describe, it, expect } from 'vitest';
import { buildWeeklyReviewFromDto } from './weeklyReviewAdapters';
import type { RevisaoSemanalOutputDto } from '../../../types/RevisaoSemanal';

const base: RevisaoSemanalOutputDto = {
    planoSemanalId: 'p1',
    semanaInicio: '2026-05-05',
    semanaFim: '2026-05-11',
    recommendationType: 'MAINTAIN',
    adherenceStatus: 'MEDIA',
    completionRate: 75,
    tsbFim: -5,
    sufficientData: true,
    weekOverWeekDelta: { primeiraSemana: true },
    geradaEm: '2026-05-11T10:00:00Z',
};

describe('buildWeeklyReviewFromDto', () => {
    it('mapeia rótulos PT-BR e o período', () => {
        const vm = buildWeeklyReviewFromDto(base);
        expect(vm.periodo).toBe('05/05 – 11/05');
        expect(vm.recomendacao).toBe('Manter');
        expect(vm.aderencia).toBe('Média');
        expect(vm.percentual).toBe(75);
        expect(vm.sufficientData).toBe(true);
    });

    it('deltaResumo é null na primeira semana', () => {
        expect(buildWeeklyReviewFromDto(base).deltaResumo).toBeNull();
    });

    it('deltaResumo formatado com Δs e a recomendação anterior quando há semana anterior', () => {
        const vm = buildWeeklyReviewFromDto({
            ...base,
            weekOverWeekDelta: {
                primeiraSemana: false,
                deltaPercentualRealizacao: 15,
                deltaTsbFim: -8,
                recommendationAnterior: 'RECOVERY',
            },
        });
        expect(vm.deltaResumo).toBe('aderência +15% · TSB -8 · era "Recuperação"');
    });

    it('percentual ausente vira null', () => {
        expect(buildWeeklyReviewFromDto({ ...base, completionRate: undefined }).percentual).toBeNull();
    });
});
