import { describe, expect, it } from 'vitest';
import {
    formatPaceRange,
    normalizarFc,
    normalizarPace,
    zonaDoPonto,
    matchZone,
    parseCanonicalFc,
    parseCanonicalPace,
    toCanonicalFc,
    toCanonicalPace,
} from './intensityFormat';
import type { AthleteTrainingZoneDto } from '../../../types/AthleteTrainingZones';

// Atleta com paceLimiar 5:00 e fcLimiar 168 (faixas base do backend)
const ZONAS: AthleteTrainingZoneDto[] = [
    { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
    { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
    { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
    { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
    { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
    { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 } },
];

describe('formatação', () => {
    it('formatPaceRange mostra m:ss–m:ss', () => {
        expect(formatPaceRange(315, 345)).toBe('5:15–5:45');
        expect(formatPaceRange(246, 270)).toBe('4:06–4:30');
    });

    it('toCanonicalPace e toCanonicalFc geram o formato que o parser do backend lê', () => {
        expect(toCanonicalPace(315, 345)).toBe('5:15-5:45/km');
        expect(toCanonicalFc(143, 150)).toBe('143-150 bpm');
    });
});

describe('parseCanonical*', () => {
    it('lê pace em faixa, com ou sem /km', () => {
        expect(parseCanonicalPace('5:15-5:45/km')).toEqual({ minSegKm: 315, maxSegKm: 345 });
        expect(parseCanonicalPace('4:30-4:45')).toEqual({ minSegKm: 270, maxSegKm: 285 });
    });

    it('lê pace único como faixa de um ponto', () => {
        expect(parseCanonicalPace('5:00/km')).toEqual({ minSegKm: 300, maxSegKm: 300 });
    });

    it('lê FC em bpm', () => {
        expect(parseCanonicalFc('143-150 bpm')).toEqual({ min: 143, max: 150 });
        expect(parseCanonicalFc('143-150bpm')).toEqual({ min: 143, max: 150 });
    });

    it('texto livre e formatos fora do canônico viram null (nunca descartados em silêncio)', () => {
        expect(parseCanonicalPace('trote leve')).toBeNull();
        expect(parseCanonicalPace('5:75-6:00/km')).toBeNull();
        expect(parseCanonicalFc('Z2')).toBeNull();
        expect(parseCanonicalFc('85-89%')).toBeNull();
        expect(parseCanonicalFc(undefined)).toBeNull();
    });
});

describe('matchZone', () => {
    it('casa FC e pace exatos na mesma zona', () => {
        expect(matchZone({ min: 143, max: 150 }, { minSegKm: 315, maxSegKm: 345 }, ZONAS)).toBe('Z2');
    });

    it('casa só por FC quando não há pace', () => {
        expect(matchZone({ min: 168, max: 178 }, undefined, ZONAS)).toBe('Z5');
    });

    it('casa só por pace quando não há FC (Z6 não tem FC)', () => {
        expect(matchZone(undefined, { minSegKm: 246, maxSegKm: 270 }, ZONAS)).toBe('Z6');
    });

    it('FC e pace de zonas diferentes não casam nenhuma', () => {
        expect(matchZone({ min: 143, max: 150 }, { minSegKm: 270, maxSegKm: 285 }, ZONAS)).toBeNull();
    });

    it('tolerância de FC: 1 bpm casa, 2 bpm não', () => {
        expect(matchZone({ min: 144, max: 151 }, undefined, ZONAS)).toBe('Z2');
        expect(matchZone({ min: 145, max: 150 }, undefined, ZONAS)).toBeNull();
        expect(matchZone({ min: 143, max: 152 }, undefined, ZONAS)).toBeNull();
    });

    it('tolerância de pace: 2 s casa, 3 s não', () => {
        expect(matchZone(undefined, { minSegKm: 317, maxSegKm: 343 }, ZONAS)).toBe('Z2');
        expect(matchZone(undefined, { minSegKm: 318, maxSegKm: 345 }, ZONAS)).toBeNull();
        expect(matchZone(undefined, { minSegKm: 315, maxSegKm: 348 }, ZONAS)).toBeNull();
    });

    it('sem FC nem pace não casa', () => {
        expect(matchZone(undefined, undefined, ZONAS)).toBeNull();
    });

    it('FC informada numa zona sem FC (Z6) não casa', () => {
        expect(matchZone({ min: 168, max: 178 }, { minSegKm: 246, maxSegKm: 270 }, ZONAS)).toBeNull();
    });
});

describe('normalização do que o treinador digita', () => {
    it('acrescenta a unidade que o parser do backend exige', () => {
        expect(normalizarFc('143-150')).toBe('143-150 bpm');
        expect(normalizarPace('5:10-5:20')).toBe('5:10-5:20/km');
        expect(normalizarPace('5:10')).toBe('5:10/km');
    });

    it('não mexe no que já está completo nem no texto livre', () => {
        expect(normalizarFc('143-150 bpm')).toBe('143-150 bpm');
        expect(normalizarFc('trote leve')).toBe('trote leve');
        expect(normalizarPace('5:10-5:20/km')).toBe('5:10-5:20/km');
        expect(normalizarPace('rápido')).toBe('rápido');
    });
});

describe('zonaDoPonto', () => {
    it('diz em que zona cai cada valor, mesmo digitado à mão', () => {
        // pace 4:40-4:50 (280-290, meio 285 → borda Z4/Z5) e FC 145-152 (meio 148,5 → Z2)
        const r = zonaDoPonto({ min: 145, max: 152 }, { minSegKm: 275, maxSegKm: 283 }, ZONAS);

        expect(r).toEqual({ fc: 'Z2', pace: 'Z5' });
    });

    it('valor fora de qualquer zona devolve null', () => {
        expect(zonaDoPonto({ min: 190, max: 200 }, { minSegKm: 100, maxSegKm: 110 }, ZONAS)).toEqual({ fc: null, pace: null });
    });
});
