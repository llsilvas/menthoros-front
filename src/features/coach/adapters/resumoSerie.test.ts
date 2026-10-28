import { describe, expect, it } from 'vitest';
import { resumoDaSerie } from './resumoSerie';
import type { EtapaTreinoDto } from '../../../types/PlanoReview';

const serie = (reps: number, sub: Partial<EtapaTreinoDto>): EtapaTreinoDto[] =>
    Array.from({ length: reps }, () => [
        { tipoEtapa: 'INTERVALADO', blocoId: 'b', blocoRepeticoes: reps, ...sub },
        { tipoEtapa: 'RECUPERACAO', blocoId: 'b', blocoRepeticoes: reps, duracaoMin: 2 },
    ]).flat();

describe('resumoDaSerie', () => {
    it('série por distância curta vira "6 × 800 m"', () => {
        expect(resumoDaSerie(serie(6, { distanciaKm: 0.8 }))).toBe('6 × 800 m');
    });

    it('distância a partir de 1 km usa km com vírgula', () => {
        expect(resumoDaSerie(serie(4, { distanciaKm: 1.6 }))).toBe('4 × 1,6 km');
        expect(resumoDaSerie(serie(3, { distanciaKm: 2 }))).toBe('3 × 2 km');
    });

    it('sem distância, usa a duração', () => {
        expect(resumoDaSerie(serie(5, { duracaoMin: 4 }))).toBe('5 × 4 min');
    });

    it('série inferida de repetição sem blocoId também conta', () => {
        const solto: EtapaTreinoDto[] = [0, 1, 2, 3].flatMap(() => [
            { tipoEtapa: 'INTERVALADO', duracaoMin: 1 },
            { tipoEtapa: 'RECUPERACAO', duracaoMin: 2 },
        ]);

        expect(resumoDaSerie(solto)).toBe('4 × 1 min');
    });

    it('sem série devolve null', () => {
        expect(resumoDaSerie(undefined)).toBeNull();
        expect(resumoDaSerie([{ tipoEtapa: 'PRINCIPAL', duracaoMin: 40 }])).toBeNull();
    });
});
