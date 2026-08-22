import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePmcBackfillNotice } from './usePmcBackfillNotice';

/**
 * jsdom neste projeto não expõe `window.localStorage` de forma confiável — stub em memória via
 * `vi.stubGlobal` (mesmo padrão de `useCalibracao.test.ts`).
 */
function createLocalStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { store = {}; },
    };
}

describe('usePmcBackfillNotice', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createLocalStorageMock());
    });

    it('começa não-dispensado quando não há flag persistida', () => {
        const { result } = renderHook(() => usePmcBackfillNotice());

        expect(result.current.dismissed).toBe(false);
    });

    it('dismiss() marca como dispensado e persiste em localStorage', () => {
        const { result } = renderHook(() => usePmcBackfillNotice());

        act(() => result.current.dismiss());

        expect(result.current.dismissed).toBe(true);
        expect(localStorage.getItem('menthoros:pmc:backfillNoticeDismissed')).toBe('true');
    });

    it('respeita a flag já persistida de uma visita anterior', () => {
        localStorage.setItem('menthoros:pmc:backfillNoticeDismissed', 'true');

        const { result } = renderHook(() => usePmcBackfillNotice());

        expect(result.current.dismissed).toBe(true);
    });

    it('degrada para não-dispensado quando localStorage lança (iframe sandboxed/modo privado)', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('bloqueado'); },
            setItem: () => { throw new Error('bloqueado'); },
        });

        const { result } = renderHook(() => usePmcBackfillNotice());

        expect(result.current.dismissed).toBe(false);
        expect(() => act(() => result.current.dismiss())).not.toThrow();
    });
});
