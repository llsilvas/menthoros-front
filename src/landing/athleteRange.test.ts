import { describe, it, expect } from 'vitest';
import { faixaDeAtletas } from './athleteRange';

describe('faixaDeAtletas', () => {
  it('mapeia os limites de cada faixa', () => {
    expect(faixaDeAtletas(1)).toBe('ATE_10');
    expect(faixaDeAtletas(10)).toBe('ATE_10');
    expect(faixaDeAtletas(11)).toBe('DE_11_A_30');
    expect(faixaDeAtletas(30)).toBe('DE_11_A_30');
    expect(faixaDeAtletas(31)).toBe('DE_31_A_100');
    expect(faixaDeAtletas(100)).toBe('DE_31_A_100');
    expect(faixaDeAtletas(101)).toBe('MAIS_DE_100');
    expect(faixaDeAtletas(500)).toBe('MAIS_DE_100');
  });
});
