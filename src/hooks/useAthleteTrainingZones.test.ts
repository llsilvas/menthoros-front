import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidarZonasDoAtleta, useAthleteTrainingZones } from './useAthleteTrainingZones';
import { ApiError } from '../api/core/ApiError';
import { CoachAthleteZonesService } from '../api/services/CoachAthleteZonesService';
import type { AthleteTrainingZonesDto } from '../types/AthleteTrainingZones';

vi.mock('../api/services/CoachAthleteZonesService');

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [],
};

function erroHttp(status: number): ApiError {
    return new ApiError(
        { method: 'GET', url: '/x' },
        { url: '/x', ok: false, status, statusText: 'x', body: null },
        'erro',
    );
}

describe('useAthleteTrainingZones', () => {
    beforeEach(() => vi.clearAllMocks());

    it('busca as zonas do atleta ao montar', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockResolvedValue(ZONES);

        const { result } = renderHook(() => useAthleteTrainingZones('atleta-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(CoachAthleteZonesService.getZonas).toHaveBeenCalledWith('atleta-1');
        expect(result.current.zones).toEqual(ZONES);
        expect(result.current.error).toBeNull();
    });

    it('sem atletaId não chama o serviço nem fica em loading', async () => {
        const { result } = renderHook(() => useAthleteTrainingZones(undefined));

        expect(CoachAthleteZonesService.getZonas).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.zones).toBeNull();
    });

    it('popula error na falha e mantém zones nulo', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockRejectedValue(erroHttp(500));

        const { result } = renderHook(() => useAthleteTrainingZones('atleta-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.zones).toBeNull();
    });

    it('404 vira zones nulo sem erro (atleta fora do tenant)', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockRejectedValue(erroHttp(404));

        const { result } = renderHook(() => useAthleteTrainingZones('atleta-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.zones).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('troca de atleta busca de novo e descarta as zonas do anterior', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockResolvedValue(ZONES);
        const { result, rerender } = renderHook(({ id }) => useAthleteTrainingZones(id), {
            initialProps: { id: 'atleta-1' as string | undefined },
        });
        await waitFor(() => expect(result.current.zones).toEqual(ZONES));

        rerender({ id: 'atleta-2' });

        await waitFor(() =>
            expect(CoachAthleteZonesService.getZonas).toHaveBeenLastCalledWith('atleta-2'),
        );
    });

    it('fetchZones refaz a busca sob demanda', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockResolvedValue(ZONES);
        const { result } = renderHook(() => useAthleteTrainingZones('atleta-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.fetchZones();
        });

        expect(CoachAthleteZonesService.getZonas).toHaveBeenCalledTimes(2);
    });

    it('invalidarZonasDoAtleta recarrega todas as instâncias do atleta e só dele', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockResolvedValue(ZONES);
        const a1 = renderHook(() => useAthleteTrainingZones('atleta-1'));
        const a1bis = renderHook(() => useAthleteTrainingZones('atleta-1'));
        const a2 = renderHook(() => useAthleteTrainingZones('atleta-2'));
        await waitFor(() => expect(a2.result.current.loading).toBe(false));
        await waitFor(() => expect(a1.result.current.loading).toBe(false));
        await waitFor(() => expect(a1bis.result.current.loading).toBe(false));
        vi.mocked(CoachAthleteZonesService.getZonas).mockClear();

        act(() => invalidarZonasDoAtleta('atleta-1'));

        await waitFor(() => expect(CoachAthleteZonesService.getZonas).toHaveBeenCalledTimes(2));
        expect(CoachAthleteZonesService.getZonas).not.toHaveBeenCalledWith('atleta-2');
    });

    it('instância desmontada deixa de ser invalidada', async () => {
        vi.mocked(CoachAthleteZonesService.getZonas).mockResolvedValue(ZONES);
        const h = renderHook(() => useAthleteTrainingZones('atleta-1'));
        await waitFor(() => expect(h.result.current.loading).toBe(false));
        h.unmount();
        vi.mocked(CoachAthleteZonesService.getZonas).mockClear();

        invalidarZonasDoAtleta('atleta-1');

        expect(CoachAthleteZonesService.getZonas).not.toHaveBeenCalled();
    });

    it('descarta resposta antiga que chega depois de uma mais nova', async () => {
        const velha = { ...ZONES, modelo: 'VELHA' };
        const nova = { ...ZONES, modelo: 'NOVA' };
        let resolveVelha!: (z: AthleteTrainingZonesDto) => void;
        vi.mocked(CoachAthleteZonesService.getZonas)
            .mockImplementationOnce(
                () => new Promise<AthleteTrainingZonesDto>((r) => (resolveVelha = r)) as never,
            )
            .mockResolvedValueOnce(nova);
        const { result } = renderHook(() => useAthleteTrainingZones('atleta-1'));

        await act(async () => {
            await result.current.fetchZones();
        });
        expect(result.current.zones?.modelo).toBe('NOVA');
        await act(async () => resolveVelha(velha));

        expect(result.current.zones?.modelo).toBe('NOVA');
    });

    it('descarta resposta do atleta anterior após a troca', async () => {
        let resolveA1!: (z: AthleteTrainingZonesDto) => void;
        vi.mocked(CoachAthleteZonesService.getZonas)
            .mockImplementationOnce(
                () => new Promise<AthleteTrainingZonesDto>((r) => (resolveA1 = r)) as never,
            )
            .mockResolvedValueOnce({ ...ZONES, modelo: 'ATLETA2' });
        const { result, rerender } = renderHook(({ id }) => useAthleteTrainingZones(id), {
            initialProps: { id: 'atleta-1' },
        });

        rerender({ id: 'atleta-2' });
        await waitFor(() => expect(result.current.zones?.modelo).toBe('ATLETA2'));
        await act(async () => resolveA1({ ...ZONES, modelo: 'ATLETA1' }));

        expect(result.current.zones?.modelo).toBe('ATLETA2');
    });
});
