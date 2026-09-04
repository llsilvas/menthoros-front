import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteWorkoutAnalysis } from './useAthleteWorkoutAnalysis';
import { AthleteAnalysisService } from '../../../api/services/AthleteAnalysisService';
import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';

vi.mock('../../../api/services/AthleteAnalysisService', () => ({
    AthleteAnalysisService: { getByRealizado: vi.fn() },
}));

const getByRealizado = vi.mocked(AthleteAnalysisService.getByRealizado);

// Com fake timers, o waitFor do RTL (timers reais) trava — flush explícito de microtasks.
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

const pendente: AthleteWorkoutAnalysis = { status: 'PENDING', executado: { rpe: 7 } };
const completa: AthleteWorkoutAnalysis = {
    status: 'COMPLETED',
    comoFoi: 'Saiu como planejado.',
    executado: { rpe: 7 },
};

describe('useAthleteWorkoutAnalysis', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('sem id fica idle e não consulta', () => {
        const { result } = renderHook(() => useAthleteWorkoutAnalysis(null));

        expect(result.current.status).toBe('idle');
        expect(getByRealizado).not.toHaveBeenCalled();
    });

    it('COMPLETED vira done sem novas consultas', async () => {
        getByRealizado.mockResolvedValue(completa);

        const { result } = renderHook(() => useAthleteWorkoutAnalysis('t1'));

        await flush();
        expect(result.current.status).toBe('done');
        expect(result.current.analysis?.comoFoi).toBe('Saiu como planejado.');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(getByRealizado).toHaveBeenCalledTimes(1);
    });

    it('204 vira empty e para', async () => {
        getByRealizado.mockResolvedValue(null);

        const { result } = renderHook(() => useAthleteWorkoutAnalysis('t1'));

        await flush();
        expect(result.current.status).toBe('empty');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(getByRealizado).toHaveBeenCalledTimes(1);
    });

    it('pending reconsulta a cada 15 s e para ao ficar done', async () => {
        getByRealizado
            .mockResolvedValueOnce(pendente)
            .mockResolvedValueOnce(pendente)
            .mockResolvedValue(completa);

        const { result } = renderHook(() => useAthleteWorkoutAnalysis('t1'));

        await flush();
        expect(result.current.status).toBe('pending');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(15_000);
        });
        expect(result.current.status).toBe('pending');
        expect(getByRealizado).toHaveBeenCalledTimes(2);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(15_000);
        });
        expect(result.current.status).toBe('done');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(getByRealizado).toHaveBeenCalledTimes(3);
    });

    it('para de consultar depois de 12 tentativas (3 min) e segue pending', async () => {
        getByRealizado.mockResolvedValue(pendente);

        const { result } = renderHook(() => useAthleteWorkoutAnalysis('t1'));

        await flush();
        expect(result.current.status).toBe('pending');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(10 * 60_000);
        });

        expect(getByRealizado).toHaveBeenCalledTimes(12);
        expect(result.current.status).toBe('pending');
    });

    it('desmontar cancela o polling', async () => {
        getByRealizado.mockResolvedValue(pendente);

        const { result, unmount } = renderHook(() => useAthleteWorkoutAnalysis('t1'));
        await flush();
        expect(result.current.status).toBe('pending');

        unmount();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(getByRealizado).toHaveBeenCalledTimes(1);
    });

    it('erro vira error', async () => {
        getByRealizado.mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteWorkoutAnalysis('t1'));

        await flush();
        expect(result.current.status).toBe('error');
        expect(result.current.error?.message).toBe('boom');
    });
});
