import { describe, it, expect } from 'vitest';
import { parseDuracaoMin } from './parseDuracaoMin';

describe('parseDuracaoMin', () => {
  it('converte "HH:MM:SS" em minutos arredondados', () => {
    expect(parseDuracaoMin('01:05:30')).toBe(66); // 65min30s → 66
    expect(parseDuracaoMin('01:00:00')).toBe(60);
    expect(parseDuracaoMin('00:45:00')).toBe(45);
  });

  it('aceita formato "00:MM:SS" (menos de uma hora)', () => {
    expect(parseDuracaoMin('00:30:00')).toBe(30);
    expect(parseDuracaoMin('00:00:30')).toBe(1); // 0.5min → 1
  });

  it('retorna null para valor ausente ou malformado (fallback seguro, não NaN)', () => {
    expect(parseDuracaoMin(undefined)).toBeNull();
    expect(parseDuracaoMin(null)).toBeNull();
    expect(parseDuracaoMin('')).toBeNull();
    expect(parseDuracaoMin('abc')).toBeNull();
    expect(parseDuracaoMin('1:2')).toBeNull(); // partes insuficientes
    expect(parseDuracaoMin('aa:bb:cc')).toBeNull();
  });
});
