import { describe, expect, it } from 'vitest';
import {
    parseNumeroNaoNegativo, toSeasonWeekForm, toSeasonWeekUpdate, validateSeasonWeekForm,
} from './seasonWeekForm';
import type { SeasonWeek } from '../../../types/SeasonPlan';

const SEMANA: SeasonWeek = {
    weekIndex: 3, weekStart: '2026-11-23', phase: 'BUILD', targetVolumeKm: 42.5, targetTss: 310.4, deload: false,
    longRunKm: 12, valueSource: 'ENGINE', locked: false, keySessions: '5x1km',
};

describe('seasonWeekForm', () => {
    it.each([
        ['45', 45], ['45,5', 45.5], ['45.5', 45.5], [' 0 ', 0],
        ['', undefined], ['-2', undefined], ['1e3', undefined], ['0x10', undefined], ['4,5,1', undefined],
    ])('parseNumeroNaoNegativo(%j) = %j', (texto, esperado) => {
        expect(parseNumeroNaoNegativo(texto)).toBe(esperado);
    });

    it('formulário nasce da semana, com o TSS arredondado', () => {
        expect(toSeasonWeekForm(SEMANA)).toEqual({
            phase: 'BUILD', targetVolumeKm: '42.5', longRunKm: '12', targetTss: '310', deload: false, keySessions: '5x1km',
        });
    });

    it('campo numérico vazio ou inválido é erro: o backend não limpa valor', () => {
        const erros = validateSeasonWeekForm({ ...toSeasonWeekForm(SEMANA), longRunKm: '', targetTss: '-1' });

        expect(Object.keys(erros).sort()).toEqual(['longRunKm', 'targetTss']);
    });

    it('corpo do PATCH com números e sessões-chave sem espaços nas pontas', () => {
        expect(toSeasonWeekUpdate({ ...toSeasonWeekForm(SEMANA), targetVolumeKm: '45,5', keySessions: ' 6x1km ' })).toEqual({
            phase: 'BUILD', targetVolumeKm: 45.5, longRunKm: 12, targetTss: 310, deload: false, keySessions: '6x1km',
        });
    });
});
