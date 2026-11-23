import { describe, expect, it } from 'vitest';
import {
    coachEditedWeeks, countPhaseWeeks, formatDiffValue, indexDiff, joinWeeks, parseStartVolume, weeksToRegenerate,
} from './seasonAdjust';
import type { SeasonWeek } from '../../../types/SeasonPlan';

const semana = (weekIndex: number, extra: Partial<SeasonWeek> = {}): SeasonWeek => ({
    weekIndex, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40, targetTss: 300, deload: false,
    valueSource: 'ENGINE', locked: false, ...extra,
});

describe('seasonAdjust', () => {
    it('conta as semanas por fase editável, sem a da prova', () => {
        const weeks = [semana(1), semana(2, { phase: 'BUILD' }), semana(3, { phase: 'TAPER' }), semana(4, { phase: 'RACE_WEEK', locked: true })];

        expect(countPhaseWeeks(weeks)).toEqual({ BASE: 1, BUILD: 1, PEAK: 0, TAPER: 1 });
    });

    it('separa as semanas regeneradas das editadas pelo treinador; travadas ficam fora das duas', () => {
        const weeks = [
            semana(1, { locked: true, lockReason: 'COMPLETED' }),
            semana(2, { valueSource: 'COACH' }),
            semana(3),
            semana(4, { valueSource: 'AI_ACCEPTED' }),
            semana(5, { locked: true, valueSource: 'COACH' }),
        ];

        expect(weeksToRegenerate(weeks)).toEqual([3, 4]);
        expect(coachEditedWeeks(weeks)).toEqual([2]);
    });

    it('junta as semanas em português', () => {
        expect(joinWeeks([])).toBe('');
        expect(joinWeeks([3])).toBe('3');
        expect(joinWeeks([3, 4])).toBe('3 e 4');
        expect(joinWeeks([3, 4, 5])).toBe('3, 4 e 5');
    });

    it.each([
        ['40', 40], ['40,5', 40.5], ['40.5', 40.5], [' 500 ', 500],
        ['', null], ['0', null], ['-1', null], ['500,1', null], ['40,55', null], ['abc', null],
    ])('volume "%s" vira %s', (texto, esperado) => {
        expect(parseStartVolume(texto)).toBe(esperado);
    });

    it('formata cada campo do diff', () => {
        expect(formatDiffValue('phase', 'BUILD')).toBe('Construção');
        expect(formatDiffValue('longRunKm', 18)).toBe('18,0 km');
        expect(formatDiffValue('targetTss', 310.6)).toBe('311');
        expect(formatDiffValue('deload', true)).toBe('sim');
        expect(formatDiffValue('keySessions', 'Tiros 6x1k')).toBe('Tiros 6x1k');
        expect(formatDiffValue('longRunKm', null)).toBe('—');
    });

    it('indexa o diff por semana e campo', () => {
        const entry = { weekIndex: 5, field: 'longRunKm' as const, before: 18, after: 20, source: 'COACH' as const };

        expect(indexDiff([entry]).get('5:longRunKm')).toBe(entry);
    });
});
