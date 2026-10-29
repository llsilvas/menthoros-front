import { describe, expect, it } from 'vitest';
import { defaultAlvoPrimario } from './alvoPrimario';

describe('defaultAlvoPrimario', () => {
    it.each([
        ['INTERVALADO', 'Z2', 'PACE'],
        ['INTERVALADO', 'Z4', 'PACE'],
        ['TIRO', 'Z3', 'PACE'],
        ['PRINCIPAL', 'Z5', 'PACE'],
        ['PRINCIPAL', 'Z6', 'PACE'],
        ['RECUPERACAO', 'Z5', 'PACE'],
        ['AQUECIMENTO', 'Z6', 'PACE'],
    ] as const)('%s em %s pré-preenche PACE (intervalado/tiro/Z5-Z6 vencem)', (tipo, zona, esperado) => {
        expect(defaultAlvoPrimario(tipo, zona)).toBe(esperado);
    });

    it.each([
        ['AQUECIMENTO', 'Z1'],
        ['AQUECIMENTO', 'Z3'],
        ['RECUPERACAO', 'Z1'],
        ['DESAQUECIMENTO', 'Z2'],
        ['PRINCIPAL', 'Z1'],
        ['PRINCIPAL', 'Z2'],
        ['PRINCIPAL', 'Z3'],
        ['PRINCIPAL', 'Z4'],
    ] as const)('%s em %s pré-preenche FC', (tipo, zona) => {
        expect(defaultAlvoPrimario(tipo, zona)).toBe('FC');
    });

    it('tipo em minúsculas e sem zona (personalizado) cai na regra do tipo', () => {
        expect(defaultAlvoPrimario('intervalado', null)).toBe('PACE');
        expect(defaultAlvoPrimario('PRINCIPAL', null)).toBe('FC');
        expect(defaultAlvoPrimario('PRINCIPAL', 'PERSONALIZADO')).toBe('FC');
    });
});
