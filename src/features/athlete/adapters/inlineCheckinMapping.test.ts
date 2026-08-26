import { describe, expect, it } from 'vitest';
import { CHECKIN_ITENS, nivelParaValor, valorParaNivel, selecaoParaInput, selecaoDeCheckin } from './inlineCheckinMapping';
import type { CheckinProntidaoOutput } from '../../../types/Checkin';

describe('inlineCheckinMapping (design D2)', () => {
  it('positivos: 1/2/3 → 3/6/9', () => {
    for (const k of ['qualidadeSono', 'humor', 'nivelEnergia'] as const) {
      expect([nivelParaValor(k, 1), nivelParaValor(k, 2), nivelParaValor(k, 3)]).toEqual([3, 6, 9]);
    }
  });

  it('invertidos (dores, estresse): 1/2/3 → 8/4/0', () => {
    for (const k of ['doresMusculares', 'estresse'] as const) {
      expect([nivelParaValor(k, 1), nivelParaValor(k, 2), nivelParaValor(k, 3)]).toEqual([8, 4, 0]);
    }
  });

  it('valor → nível: ≤4 / 5–7 / ≥8; invertidos ≤3 / 4–7 / ≥8', () => {
    expect(valorParaNivel('qualidadeSono', 4)).toBe(1);
    expect(valorParaNivel('qualidadeSono', 5)).toBe(2);
    expect(valorParaNivel('qualidadeSono', 8)).toBe(3);
    expect(valorParaNivel('estresse', 8)).toBe(1);
    expect(valorParaNivel('estresse', 4)).toBe(2);
    expect(valorParaNivel('estresse', 3)).toBe(3);
  });

  it('ida e volta preserva o nível', () => {
    for (const { key } of CHECKIN_ITENS) {
      for (const n of [1, 2, 3] as const) expect(valorParaNivel(key, nivelParaValor(key, n))).toBe(n);
    }
  });

  it('selecaoParaInput só monta o DTO com os cinco itens', () => {
    expect(selecaoParaInput({ qualidadeSono: 3, humor: 3, doresMusculares: 3, nivelEnergia: 3, estresse: null })).toBeNull();
    expect(selecaoParaInput({ qualidadeSono: 3, humor: 2, doresMusculares: 3, nivelEnergia: 3, estresse: 3 })).toEqual({
      qualidadeSono: 9, humor: 6, doresMusculares: 0, nivelEnergia: 9, estresse: 0,
    });
  });

  it('selecaoDeCheckin deriva a seleção de um check-in existente', () => {
    const c = { qualidadeSono: 8, humor: 5, doresMusculares: 4, nivelEnergia: 2, estresse: 9 } as CheckinProntidaoOutput;
    expect(selecaoDeCheckin(c)).toEqual({ qualidadeSono: 3, humor: 2, doresMusculares: 2, nivelEnergia: 1, estresse: 1 });
  });
});
