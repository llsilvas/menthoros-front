import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIosInstallHint, IOS_HINT_DISMISS_KEY } from './useIosInstallHint';

/**
 * Hint de instalação para iOS (add-athlete-pwa-ux-hints, task 1.2).
 *
 * O critério é `navigator.standalone === false` — propriedade só do MobileSafari (`false` = aba,
 * `true` = lançado da tela inicial, `undefined` = qualquer outro navegador, inclusive Chrome/Firefox
 * no iOS). O jsdom não a define nem fornece `matchMedia`; os testes stubam as duas.
 */

function definirStandalone(valor: boolean | undefined) {
  Object.defineProperty(navigator, 'standalone', { value: valor, configurable: true });
}

function stubMatchMedia(rodandoStandalone: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: rodandoStandalone && query === '(display-mode: standalone)',
    })),
  );
}

describe('useIosInstallHint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (navigator as { standalone?: boolean }).standalone;
  });

  it('Safari iOS em aba, não instalado: mostra o hint', () => {
    definirStandalone(false);
    stubMatchMedia(false);

    const { result } = renderHook(() => useIosInstallHint());

    expect(result.current.canShow).toBe(true);
  });

  it('display-mode standalone casando: não mostra (já instalado)', () => {
    definirStandalone(false);
    stubMatchMedia(true);

    const { result } = renderHook(() => useIosInstallHint());

    expect(result.current.canShow).toBe(false);
  });

  it('lançado da tela inicial (standalone === true): não mostra', () => {
    definirStandalone(true);
    stubMatchMedia(false);

    const { result } = renderHook(() => useIosInstallHint());

    expect(result.current.canShow).toBe(false);
  });

  it('outra plataforma (standalone undefined): não mostra', () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => useIosInstallHint());

    expect(result.current.canShow).toBe(false);
  });

  it('sem matchMedia (jsdom cru) e standalone === false: mostra', () => {
    definirStandalone(false);

    const { result } = renderHook(() => useIosInstallHint());

    expect(result.current.canShow).toBe(true);
  });

  it('já dispensado: não mostra mesmo elegível, e a chave sobrevive ao remount', () => {
    localStorage.setItem(IOS_HINT_DISMISS_KEY, '1');
    definirStandalone(false);
    stubMatchMedia(false);

    const { result, unmount } = renderHook(() => useIosInstallHint());
    expect(result.current.canShow).toBe(false);

    unmount();
    const remontado = renderHook(() => useIosInstallHint());
    expect(remontado.result.current.canShow).toBe(false);
  });

  it('dismiss() grava a chave e esconde o hint', () => {
    definirStandalone(false);
    stubMatchMedia(false);
    const { result } = renderHook(() => useIosInstallHint());
    expect(result.current.canShow).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem(IOS_HINT_DISMISS_KEY)).toBe('1');
    expect(result.current.canShow).toBe(false);
  });

  it('localStorage indisponível não quebra: mostra, e dismiss() esconde só nesta sessão', () => {
    const storageQuebrado = {
      getItem: () => {
        throw new Error('storage bloqueado');
      },
      setItem: () => {
        throw new Error('storage bloqueado');
      },
    };
    vi.stubGlobal('localStorage', storageQuebrado);
    definirStandalone(false);
    stubMatchMedia(false);

    const { result } = renderHook(() => useIosInstallHint());
    expect(result.current.canShow).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.canShow).toBe(false);
  });
});
