import { describe, expect, it } from 'vitest';
import { duracaoEmMinutos } from './duracaoTreino';

describe('duracaoEmMinutos', () => {
    it.each([
        ['PT55M', 55],
        ['PT1H30M', 90],
        ['PT2H', 120],
        ['01:30:00', 90],
        ['45:00', 45],
    ])('%s → %i min', (entrada, esperado) => {
        expect(duracaoEmMinutos(entrada)).toBe(esperado);
    });

    it.each([[undefined], [null], [''], ['PT0M'], ['abc']])('%s → null', (entrada) => {
        expect(duracaoEmMinutos(entrada as string | null | undefined)).toBeNull();
    });
});
