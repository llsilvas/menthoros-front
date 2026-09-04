import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAggregatedFetchErrors } from './useAggregatedFetchErrors';

describe('useAggregatedFetchErrors', () => {
  it('lista só as fontes que falharam, na ordem dada', () => {
    const { result } = renderHook(() => useAggregatedFetchErrors([
      { label: 'prontidão', error: new Error('x'), refetch: vi.fn() },
      { label: 'streak', error: null, refetch: vi.fn() },
      { label: 'calibração', error: new Error('y'), refetch: vi.fn() },
    ]));
    expect(result.current.failed).toEqual(['prontidão', 'calibração']);
    expect(result.current.hasErrors).toBe(true);
  });

  it('retryAll refetcha só as que falharam', async () => {
    const ok = vi.fn().mockResolvedValue(undefined);
    const a = vi.fn().mockResolvedValue(undefined);
    const b = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAggregatedFetchErrors([
      { label: 'a', error: new Error('x'), refetch: a },
      { label: 'ok', error: null, refetch: ok },
      { label: 'b', error: new Error('y'), refetch: b },
    ]));
    await act(async () => { await result.current.retryAll(); });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(ok).not.toHaveBeenCalled();
  });

  it('sem erros: lista vazia', () => {
    const { result } = renderHook(() => useAggregatedFetchErrors([{ label: 'a', error: null, refetch: vi.fn() }]));
    expect(result.current.failed).toEqual([]);
    expect(result.current.hasErrors).toBe(false);
  });
});
