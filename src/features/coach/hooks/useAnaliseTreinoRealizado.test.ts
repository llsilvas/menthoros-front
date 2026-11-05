import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import { useAnaliseTreinoRealizado } from './useAnaliseTreinoRealizado';

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

    it('204 com RPE → indisponível', async () => {
        responde(undefined);
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('indisponivel'));
        expect(result.current.data).toBeNull();
    });

    it('PENDING → indisponível', async () => {
        responde({ ...ANALISE, status: 'PENDING' });
        const { result } = renderHook(() => useAnaliseTreinoRealizado('tr-1', true));

        await waitFor(() => expect(result.current.status).toBe('indisponivel'));
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
        await waitFor(() => expect(result.current.status).toBe('indisponivel'));
        responde(ANALISE);

        act(() => result.current.refetch());

        await waitFor(() => expect(result.current.status).toBe('pronta'));
        expect(AnaliseService.getAnaliseTreino).toHaveBeenCalledTimes(2);
    });
});
