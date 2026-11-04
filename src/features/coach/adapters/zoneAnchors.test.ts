import { describe, expect, it } from 'vitest';
import {
  formatPace,
  parsePace,
  validarAncoraFc,
  validarAncoraPace,
} from './zoneAnchors';

const HOJE = '2026-11-03';
const fc = (o: Partial<Parameters<typeof validarAncoraFc>[0]> = {}) => ({
  limiar: 168,
  maxima: null,
  maximaGravada: null,
  dataTeste: '2026-10-12',
  ...o,
});

describe('parsePace / formatPace', () => {
  it.each([
    ['4:50', 290],
    ['2:30', 150],
    ['12:00', 720],
    ['4:05', 245],
  ])('parse "%s" -> %i', (txt, seg) => {
    expect(parsePace(txt)).toBe(seg);
  });

  it.each(['', '4', '4:5', '4:60', '4:50:1', 'abc', '-4:50', '4,50'])('rejeita "%s"', (txt) => {
    expect(parsePace(txt)).toBeNull();
  });

  it('ida e volta exata para 150..720', () => {
    for (let s = 150; s <= 720; s++) expect(parsePace(formatPace(s))).toBe(s);
  });
});

describe('validarAncoraFc', () => {
  it('válido sem máxima', () => {
    expect(validarAncoraFc(fc(), HOJE)).toEqual({});
  });

  it.each([null, 99, 201])('limiar %s inválido', (limiar) => {
    expect(validarAncoraFc(fc({ limiar }), HOJE).limiar).toBeDefined();
  });

  it.each([100, 200])('limiar %i nos limites é aceito', (limiar) => {
    expect(validarAncoraFc(fc({ limiar, maxima: 220 }), HOJE).limiar).toBeUndefined();
  });

  it.each([119, 221])('máxima %i fora de 120–220', (maxima) => {
    expect(validarAncoraFc(fc({ maxima }), HOJE).maxima).toBeDefined();
  });

  it('máxima 169 com limiar 168 rejeitada (piso 178); 178 aceita', () => {
    expect(validarAncoraFc(fc({ maxima: 169 }), HOJE).maxima).toContain('178');
    expect(validarAncoraFc(fc({ maxima: 178 }), HOJE).maxima).toBeUndefined();
  });

  it('máxima vazia usa a gravada para o cruzamento', () => {
    expect(validarAncoraFc(fc({ maximaGravada: 170 }), HOJE).maxima).toBeDefined();
    expect(validarAncoraFc(fc({ maximaGravada: 186 }), HOJE).maxima).toBeUndefined();
  });

  it('sem máxima real (estimada) nunca bloqueia: limiar 185 aceito', () => {
    expect(validarAncoraFc(fc({ limiar: 185 }), HOJE)).toEqual({});
  });

  it('data: ausente, anterior a 2000, futura; hoje aceita', () => {
    expect(validarAncoraFc(fc({ dataTeste: '' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: '1999-12-31' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: '2026-11-04' }), HOJE).dataTeste).toBeDefined();
    expect(validarAncoraFc(fc({ dataTeste: HOJE }), HOJE).dataTeste).toBeUndefined();
    expect(validarAncoraFc(fc({ dataTeste: '2000-01-01' }), HOJE).dataTeste).toBeUndefined();
  });
});

describe('validarAncoraPace', () => {
  const p = (limiarSegKm: number | null, dataTeste = '2026-10-12') => ({ limiarSegKm, dataTeste });

  it('válido', () => {
    expect(validarAncoraPace(p(290), HOJE)).toEqual({});
  });

  it.each([null, 149, 721])('ritmo %s inválido', (v) => {
    expect(validarAncoraPace(p(v), HOJE).limiarSegKm).toBeDefined();
  });

  it.each([150, 720])('ritmo %i nos limites aceito', (v) => {
    expect(validarAncoraPace(p(v), HOJE).limiarSegKm).toBeUndefined();
  });

  it('data futura rejeitada', () => {
    expect(validarAncoraPace(p(290, '2026-12-01'), HOJE).dataTeste).toBeDefined();
  });
});
