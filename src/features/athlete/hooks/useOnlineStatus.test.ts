import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Estado de conectividade do shell do atleta (add-athlete-pwa-ux-hints, task 1.1).
 *
 * `navigator.onLine` nunca mente "false" (só é false sem interface de rede) e pode mentir "true"
 * (portal cativo) — o hook só repassa o que o navegador afirma; não tenta detectar conectividade
 * real (non-goal).
 */
describe('useOnlineStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('começa com o valor atual de navigator.onLine', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it('vira false no evento offline e volta a true no evento online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('remove os listeners de online/offline ao desmontar', () => {
    const remover = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    const tipos = remover.mock.calls.map(([tipo]) => tipo);
    expect(tipos).toEqual(expect.arrayContaining(['online', 'offline']));
  });
});
