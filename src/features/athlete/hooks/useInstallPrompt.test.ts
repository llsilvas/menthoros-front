import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInstallPrompt, DISMISS_STORAGE_KEY } from './useInstallPrompt';

/**
 * Prompt de instalação do PWA (add-athlete-pwa-installable, task 1.6).
 *
 * O evento `beforeinstallprompt` só existe em Chromium e não é reproduzível no Playwright de CI
 * (Desktop Chrome não o garante). O que dá para provar aqui é o contrato do hook com o evento:
 * captura, `preventDefault`, `prompt()`, dispensa persistida e o sumiço após instalar.
 */

interface PromptStub extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function dispararBeforeInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const evento = new Event('beforeinstallprompt', { cancelable: true }) as PromptStub;
  evento.prompt = vi.fn().mockResolvedValue(undefined);
  evento.userChoice = Promise.resolve({ outcome, platform: 'web' });
  act(() => {
    window.dispatchEvent(evento);
  });
  return evento;
}

describe('useInstallPrompt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('começa sem poder instalar: o evento ainda não chegou', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('captura o beforeinstallprompt, segura o prompt nativo e libera o CTA', () => {
    const { result } = renderHook(() => useInstallPrompt());

    const evento = dispararBeforeInstallPrompt();

    // O navegador só entrega o prompt ao app se o default (mini-infobar) for cancelado.
    expect(evento.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);
  });

  it('promptInstall dispara o prompt guardado e, aceito, o CTA some', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const evento = dispararBeforeInstallPrompt('accepted');

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(evento.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.canInstall).toBe(false);
  });

  it('prompt recusado pelo usuário: o evento já foi consumido, o CTA some sem gravar dispensa', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    dispararBeforeInstallPrompt('dismissed');

    await act(async () => {
      await result.current.promptInstall();
    });

    // Um BeforeInstallPromptEvent só pode ser usado uma vez — sem evento, não há o que oferecer.
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem(DISMISS_STORAGE_KEY)).toBeNull();
  });

  it('"Agora não" persiste a dispensa por dispositivo e esconde o CTA', () => {
    const { result } = renderHook(() => useInstallPrompt());
    dispararBeforeInstallPrompt();

    act(() => result.current.dismiss());

    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem(DISMISS_STORAGE_KEY)).toBe('1');
  });

  it('já dispensado neste dispositivo: ignora o evento — nunca volta a cutucar', () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    const { result } = renderHook(() => useInstallPrompt());

    dispararBeforeInstallPrompt();

    expect(result.current.canInstall).toBe(false);
  });

  it('appinstalled esconde o CTA mesmo com evento guardado', () => {
    const { result } = renderHook(() => useInstallPrompt());
    dispararBeforeInstallPrompt();
    expect(result.current.canInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('já rodando instalado (display-mode: standalone): nunca oferece instalar', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({ matches: query === '(display-mode: standalone)' })),
    );
    const { result } = renderHook(() => useInstallPrompt());

    dispararBeforeInstallPrompt();

    expect(result.current.canInstall).toBe(false);
  });

  it('localStorage indisponível não quebra: o CTA funciona, só não lembra a dispensa', () => {
    const storageQuebrado = {
      getItem: () => {
        throw new Error('storage bloqueado');
      },
      setItem: () => {
        throw new Error('storage bloqueado');
      },
    };
    vi.stubGlobal('localStorage', storageQuebrado);
    const { result } = renderHook(() => useInstallPrompt());

    dispararBeforeInstallPrompt();
    expect(result.current.canInstall).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.canInstall).toBe(false);
  });
});
