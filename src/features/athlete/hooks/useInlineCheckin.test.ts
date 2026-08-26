import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInlineCheckin } from './useInlineCheckin';
import type { CheckinProntidaoOutput } from '../../../types/Checkin';

const EXISTENTE = {
  id: 'c1', atletaId: 'a1', data: '2026-08-26',
  qualidadeSono: 8, humor: 8, doresMusculares: 0, nivelEnergia: 8, estresse: 0,
  readinessScore: 0.8, nivelProntidao: 'PRONTO',
} as CheckinProntidaoOutput;

function setup(checkinHoje: CheckinProntidaoOutput | null, registrar = vi.fn().mockResolvedValue(EXISTENTE)) {
  const onSaved = vi.fn().mockResolvedValue(undefined);
  const hook = renderHook(() => useInlineCheckin({ checkinHoje, registrar, onSaved }));
  return { ...hook, registrar, onSaved };
}

describe('useInlineCheckin', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('primeiro check-in: quatro seleções não enviam nada; a quinta envia o DTO completo', async () => {
    const { result, registrar, onSaved } = setup(null);
    expect(result.current.pendentes).toBe(5);

    act(() => result.current.selecionar('qualidadeSono'));
    act(() => result.current.selecionar('humor'));
    act(() => result.current.selecionar('doresMusculares'));
    act(() => result.current.selecionar('nivelEnergia'));
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(registrar).not.toHaveBeenCalled();
    expect(result.current.pendentes).toBe(1);

    act(() => result.current.selecionar('estresse'));
    await act(async () => { await vi.runAllTimersAsync(); });
    // primeiro toque em cada item = nível 1 (pior); o DTO sai mapeado por D2
    expect(registrar).toHaveBeenCalledWith({ qualidadeSono: 3, humor: 3, doresMusculares: 8, nivelEnergia: 3, estresse: 8 });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.salvo).toBe(true);
  });

  it('check-in existente: seleção derivada e um toque envia o DTO completo (com debounce)', async () => {
    const { result, registrar } = setup(EXISTENTE);
    expect(result.current.selecao).toEqual({ qualidadeSono: 3, humor: 3, doresMusculares: 3, nivelEnergia: 3, estresse: 3 });
    expect(result.current.pendentes).toBe(0);

    act(() => result.current.selecionar('humor')); // 3 → cicla para 1
    act(() => result.current.selecionar('humor')); // 1 → 2
    expect(registrar).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledWith({ qualidadeSono: 9, humor: 6, doresMusculares: 0, nivelEnergia: 9, estresse: 0 });
  });

  it('falha no POST reverte o item ao último salvo e expõe o erro', async () => {
    const registrar = vi.fn().mockRejectedValue(new Error('500'));
    const { result } = setup(EXISTENTE, registrar);

    act(() => result.current.selecionar('estresse')); // 3 → 1
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(result.current.selecao.estresse).toBe(3);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.salvo).toBe(true); // o que está na tela é o último estado salvo
  });

  it('definir() fixa um nível sem ciclar', () => {
    const { result } = setup(null);
    act(() => result.current.definir('sono' as never, 2 as never));
    act(() => result.current.definir('qualidadeSono', 2));
    expect(result.current.selecao.qualidadeSono).toBe(2);
  });
});
