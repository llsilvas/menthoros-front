import { describe, expect, it } from 'vitest';
import { mapTipoTreino, type WorkoutType } from './workoutType';

describe('mapTipoTreino', () => {
    it.each<[string, WorkoutType]>([
        ['REGENERATIVO', 'recovery'],
        ['FACIL', 'easy_run'],
        ['CONTINUO', 'easy_run'],
        ['LONGO', 'long_run'],
        ['TEMPO_RUN', 'tempo'],
        ['PROVA', 'tempo'],
        ['INTERVALADO', 'intervals'],
        ['TIRO', 'intervals'],
        ['FARTLEK', 'intervals'],
        ['SUBIDA', 'intervals'],
    ])('mapeia %s → %s', (tipo, esperado) => {
        expect(mapTipoTreino(tipo)).toBe(esperado);
    });

    it('tipo desconhecido cai no default easy_run', () => {
        expect(mapTipoTreino('NAO_EXISTE')).toBe('easy_run');
    });

    it('undefined cai no default easy_run (sem lançar)', () => {
        expect(mapTipoTreino(undefined)).toBe('easy_run');
    });
});
