import { describe, expect, it } from 'vitest';
import { avaliarPreparacao, minimoSemanas, rotuloDistancia, semanasFaltando } from './racePreparation';

const HOJE = new Date(2026, 8, 2); // 2 de setembro

describe('minimoSemanas', () => {
  it.each([
    ['KM_5', 8],
    ['KM_10', 10],
    ['KM_21', 12],
    ['KM_42', 16],
  ] as const)('%s → %i semanas, ignorando distanciaKm', (distancia, esperado) => {
    expect(minimoSemanas(distancia)).toBe(esperado);
    expect(minimoSemanas(distancia, 99)).toBe(esperado);
  });

  it.each([
    [0.1, 8], [7.5, 8], [7.6, 10], [15, 10], [15.1, 12], [30, 12], [30.1, 16], [200, 16],
  ])('customizada de %s km usa as faixas 7,5 / 15 / 30', (km, esperado) => {
    expect(minimoSemanas('CUSTOMIZADA', km)).toBe(esperado);
  });

  it('customizada sem quilometragem positiva é inválida', () => {
    expect(() => minimoSemanas('CUSTOMIZADA')).toThrow();
    expect(() => minimoSemanas('CUSTOMIZADA', 0)).toThrow();
  });
});

describe('rotuloDistancia', () => {
  it('rotula padrão e customizada', () => {
    expect(rotuloDistancia('KM_21')).toBe('21 km');
    expect(rotuloDistancia('CUSTOMIZADA', 30)).toBe('30 km');
    expect(rotuloDistancia('CUSTOMIZADA')).toBe('Outra');
  });
});

describe('semanasFaltando', () => {
  it.each([
    ['2026-09-02', 0], ['2026-09-08', 0], ['2026-09-09', 1], ['2026-12-06', 13], ['2026-08-30', 0],
  ])('%s → %i semanas', (data, esperado) => {
    expect(semanasFaltando(data, HOJE)).toBe(esperado);
  });
});

describe('avaliarPreparacao', () => {
  it('maratona em 8 semanas é preparação curta com início no passado', () => {
    const r = avaliarPreparacao('2026-10-28', 'KM_42', null, HOJE);
    expect(r.semanasMinimas).toBe(16);
    expect(r.semanasFaltando).toBe(8);
    expect(r.preparacaoCurta).toBe(true);
    expect(r.inicioPreparacao.getTime()).toBeLessThan(HOJE.getTime());
  });

  it('maratona em 20 semanas está dentro do recomendado', () => {
    const r = avaliarPreparacao('2027-01-20', 'KM_42', null, HOJE);
    expect(r.semanasFaltando).toBe(20);
    expect(r.preparacaoCurta).toBe(false);
  });

  it('exatamente no mínimo não é curta', () => {
    const r = avaliarPreparacao('2026-12-23', 'KM_42', null, HOJE);
    expect(r.semanasFaltando).toBe(16);
    expect(r.preparacaoCurta).toBe(false);
  });

  it('"Outra" de 30 km usa a faixa de 21 km', () => {
    expect(avaliarPreparacao('2027-01-20', 'CUSTOMIZADA', 30, HOJE).semanasMinimas).toBe(12);
  });
});
