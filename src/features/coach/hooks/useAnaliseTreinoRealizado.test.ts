import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import { INTERVALO_MS, MAX_CONSULTAS, useAnaliseTreinoRealizado } from './useAnaliseTreinoRealizado';

vi.mock('../../../api/services/AnaliseService');

const ANALISE: AnaliseWorkout = { id: 'a1', treinoRealizadoId: 'tr-1', status: 'COMPLETED', summary: 'Bem executado' };
const responde = (valor: AnaliseWorkout | undefined) =>
    vi.mocked(AnaliseService.getAnaliseTreino).mockResolvedValue(valor as AnaliseWorkout);

describe('useAnaliseTreinoRealizado', () => {
    beforeEach(() => vi.clearAllMocks());

    it('COMPLETED → pronta com os dados', async () => {
        responde(ANALISE);
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        expect(result.current.status).toBe('loading');
        await waitFor(() => expect(result.current.status).toBe('pronta'));
        expect(result.current.data).toEqual(ANALISE);
    });

    it('204 com RPE → processando', async () => {
        responde(undefined);
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('processando'));
        expect(result.current.data).toBeNull();
    });

    it('PENDING → processando', async () => {
        responde({ ...ANALISE, status: 'PENDING' });
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('processando'));
    });

    it('sem RPE → semRpe, sem chamar o backend', () => {
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', false));

        expect(result.current.status).toBe('semRpe');
        expect(AnaliseService.getAnaliseTreino).not.toHaveBeenCalled();
    });

    it('FAILED → erro', async () => {
        responde({ ...ANALISE, status: 'FAILED' });
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('erro'));
    });

    it('falha na busca → erro', async () => {
        vi.mocked(AnaliseService.getAnaliseTreino).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('erro'));
    });

    it('sem id → ociosa, sem chamar o backend', () => {
        const { result } = renderHook(() => useAnaliseTreinoRealizado(undefined, true));

        expect(result.current.status).toBe('ociosa');
        expect(AnaliseService.getAnaliseTreino).not.toHaveBeenCalled();
    });

    it('refetch busca de novo', async () => {
        responde(undefined);
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));
        await waitFor(() => expect(result.current.status).toBe('processando'));
        responde(ANALISE);

        act(() => result.current.refetch());

        await waitFor(() => expect(result.current.status).toBe('pronta'));
        expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(2);
    });

    describe('polling enquanto a análise não fica pronta', () => {
        const avanca = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('a análise concluída depois do 204 aparece sem recarregar', async () => {
            responde(undefined);
            const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));
            await avanca(0);
            expect(result.current.status).toBe('processando');

            responde(ANALISE);
            await avanca(INTERVALO_MS);

            expect(result.current.status).toBe('pronta');
            expect(result.current.data).toEqual(ANALISE);
            await avanca(INTERVALO_MS * 3);
            expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(2);
        });

        it('esgotadas as consultas → indisponível, e para de consultar', async () => {
            responde(undefined);
            const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

            await avanca(INTERVALO_MS * (MAX_CONSULTAS + 3));

            expect(result.current.status).toBe('indisponivel');
            expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(MAX_CONSULTAS);
        });

        it('desmontar interrompe o polling', async () => {
            responde(undefined);
            const { unmount } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));
            await avanca(0);

            unmount();
            await avanca(INTERVALO_MS * 3);

            expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(1);
        });
    });
});
