import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteTrainingZones } from './useAthleteTrainingZones';
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
});
