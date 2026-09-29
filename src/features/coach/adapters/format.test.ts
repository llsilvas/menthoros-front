import { describe, expect, it } from 'vitest';
import { decimal, formatKmPt, plural, signed } from './format';

describe('formatadores pt-BR', () => {
  it('decimal e signed com vírgula', () => {
    expect(decimal(1.974, 2)).toBe('1,97');
    expect(signed(8.64, 1)).toBe('+8,6');
    expect(signed(-8.64, 1)).toBe('-8,6');
    expect(signed(0, 0)).toBe('0');
  });

  it('km com uma casa', () => {
    expect(formatKmPt(5)).toBe('5,0');
    expect(formatKmPt(34.25)).toBe('34,3');
  });

  it('plural com o número na frente', () => {
    expect(plural(1, 'dia', 'dias')).toBe('1 dia');
    expect(plural(3, 'dia', 'dias')).toBe('3 dias');
    expect(plural(0, 'sinal', 'sinais')).toBe('0 sinais');
  });
});
