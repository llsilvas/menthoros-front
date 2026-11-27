import { describe, expect, it } from 'vitest';
import {
    avisoPicoNaoAlcancado, consequenciaRecalculo, parseNumeroNaoNegativo, picoDeSubida, picoSugerido, podeRecalcular,
    tssProporcional, toSeasonWeekForm, toSeasonWeekUpdate, validateSeasonWeekForm,
} from './seasonWeekForm';
import type { SeasonWeek, TrainingPhase } from '../../../types/SeasonPlan';

const SEMANA: SeasonWeek = {
    weekIndex: 3, weekStart: '2026-11-23', phase: 'BUILD', targetVolumeKm: 42.5, targetTss: 310.4, deload: false,
    longRunKm: 12, valueSource: 'ENGINE', locked: false, keySessions: '5x1km',
};

/** Caso real: âncora na semana 2 (Base, 13,0 km, TSS 122), subida até a 13 (16,2 km), prova na 15. */
const semana = (i: number, extra: Partial<SeasonWeek> = {}): SeasonWeek => {
    const phase: TrainingPhase = i <= 7 ? 'BASE' : i <= 10 ? 'BUILD' : i <= 13 ? 'PEAK' : i === 14 ? 'TAPER' : 'RACE_WEEK';
    return {
        weekIndex: i, weekStart: '2026-11-23', phase, targetVolumeKm: i === 13 ? 16.2 : 13, targetTss: 122,
        deload: i === 4 || i === 8, longRunKm: 4, valueSource: 'ENGINE', locked: i === 1 || i === 15, ...extra,
    };
};
const CICLO: SeasonWeek[] = Array.from({ length: 15 }, (_, k) => semana(k + 1, k + 1 === 9 ? { valueSource: 'COACH' } : {}));
const ANCORA = CICLO[1];

describe('seasonWeekForm', () => {
    it.each([
        ['45', 45], ['45,5', 45.5], ['45.5', 45.5], [' 0 ', 0],
        ['', undefined], ['-2', undefined], ['1e3', undefined], ['0x10', undefined], ['4,5,1', undefined],
    ])('parseNumeroNaoNegativo(%j) = %j', (texto, esperado) => {
        expect(parseNumeroNaoNegativo(texto)).toBe(esperado);
    });

    it('formulário nasce da semana, com o TSS arredondado e sem recálculo', () => {
        expect(toSeasonWeekForm(SEMANA)).toEqual({
            phase: 'BUILD', targetVolumeKm: '42.5', longRunKm: '12', targetTss: '310', deload: false, keySessions: '5x1km',
            recalcular: false, followingPeakVolumeKm: '',
        });
    });

    it('campo numérico vazio ou inválido é erro: o backend não limpa valor', () => {
        const erros = validateSeasonWeekForm({ ...toSeasonWeekForm(SEMANA), longRunKm: '', targetTss: '-1' });

        expect(Object.keys(erros).sort()).toEqual(['longRunKm', 'targetTss']);
    });

    it('corpo do PATCH com números e sessões-chave sem espaços nas pontas, sem pico', () => {
        expect(toSeasonWeekUpdate({ ...toSeasonWeekForm(SEMANA), targetVolumeKm: '45,5', keySessions: ' 6x1km ' })).toStrictEqual({
            phase: 'BUILD', targetVolumeKm: 45.5, longRunKm: 12, targetTss: 310, deload: false, keySessions: '6x1km',
        });
    });

    describe('TSS proporcional ao volume', () => {
        it('122 × 20 / 13 dá 188', () => {
            expect(tssProporcional(ANCORA, '20,0')).toBe('188');
        });

        it.each([
            ['sem TSS', { targetTss: 0 }, '20'],
            ['volume original zero', { targetVolumeKm: 0 }, '20'],
            ['volume novo inválido', {}, 'abc'],
        ])('%s: não preenche', (_, extra, volume) => {
            expect(tssProporcional({ ...ANCORA, ...extra }, volume)).toBeUndefined();
        });
    });

    it.each([
        ['BASE', false, true], ['BUILD', false, true], ['PEAK', false, true],
        ['PEAK', true, false], ['TAPER', false, false],
    ] as const)('recalcular com %s e descarga %s: %s', (phase, deload, esperado) => {
        expect(podeRecalcular({ ...toSeasonWeekForm(ANCORA), phase, deload })).toBe(esperado);
    });

    describe('pico', () => {
        it('atual: maior volume entre a âncora e as semanas de subida depois dela', () => {
            expect(picoDeSubida(CICLO, 2)).toBe(16.2);
        });

        it('atual com a âncora como última de subida: o volume dela', () => {
            expect(picoDeSubida(CICLO, 13)).toBe(16.2);
        });

        it('sugerido na alta: 16,2 × 20 / 13 dá 24,9', () => {
            expect(picoSugerido(CICLO, ANCORA, '20')).toBe('24.9');
        });

        it('sugerido na redução ou sem volume original: vazio', () => {
            expect(picoSugerido(CICLO, ANCORA, '10')).toBe('');
            expect(picoSugerido(CICLO, { ...ANCORA, targetVolumeKm: 0 }, '20')).toBe('');
        });

        it('sugerido com a âncora como última de subida: o volume novo', () => {
            expect(picoSugerido(CICLO, CICLO[12], '20')).toBe('20');
        });
    });

    it('consequência: N regravadas, M ficam (COACH e travadas)', () => {
        expect(consequenciaRecalculo(CICLO, 2)).toEqual({ reescritas: 11, mantidas: 2 });
    });

    it.each([
        [30, 26.4, true], [24.2, 24.1, false], [30, 29.5, true], [30, 29.6, false],
    ])('aviso com pedido %s e alcançado %s: %s', (pedido, alcancado, avisa) => {
        const semanas = CICLO.map((w) => (w.weekIndex === 13 ? { ...w, targetVolumeKm: alcancado } : w));

        expect(avisoPicoNaoAlcancado(pedido, semanas, 2)).toBe(avisa ? alcancado : null);
    });

    it('aviso com a âncora como última de subida usa o volume dela', () => {
        const semanas = CICLO.map((w) => (w.weekIndex === 13 ? { ...w, targetVolumeKm: 20 } : w));

        expect(avisoPicoNaoAlcancado(30, semanas, 13)).toBe(20);
    });

    describe('com recálculo', () => {
        const form = { ...toSeasonWeekForm(ANCORA), targetVolumeKm: '20', targetTss: '188', recalcular: true };

        it('pico menor que o volume digitado é erro', () => {
            expect(validateSeasonWeekForm({ ...form, followingPeakVolumeKm: '19,9' })).toHaveProperty('followingPeakVolumeKm');
            expect(validateSeasonWeekForm({ ...form, followingPeakVolumeKm: '' })).toHaveProperty('followingPeakVolumeKm');
            expect(validateSeasonWeekForm({ ...form, followingPeakVolumeKm: '20' })).toEqual({});
        });

        it('envia o pico só com a opção marcada e permitida', () => {
            expect(toSeasonWeekUpdate({ ...form, followingPeakVolumeKm: '30' }).followingPeakVolumeKm).toBe(30);
            expect(toSeasonWeekUpdate({ ...form, recalcular: false, followingPeakVolumeKm: '30' })).not.toHaveProperty('followingPeakVolumeKm');
            expect(toSeasonWeekUpdate({ ...form, deload: true, followingPeakVolumeKm: '30' })).not.toHaveProperty('followingPeakVolumeKm');
        });

        it('opção não permitida ignora o pico na validação', () => {
            expect(validateSeasonWeekForm({ ...form, phase: 'TAPER', followingPeakVolumeKm: '' })).toEqual({});
        });
    });
});
