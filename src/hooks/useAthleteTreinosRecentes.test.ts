import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteTreinosRecentes } from './useAthleteTreinosRecentes';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteTreinoRecente } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const TREINOS_STUB: AthleteTreinoRecente[] = [
    { dataTreino: '2026-06-01', distanciaKm: 10.5 },
    { dataTreino: '2026-06-03', distanciaKm: null },
];

describe('useAthleteTreinosRecentes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula treinos no sucesso', async () => {
        vi.mocked(AthleteProgressService.getTreinosRecentes).mockResolvedValue(TREINOS_STUB);

        const { result } = renderHook(() => useAthleteTreinosRecentes());
        await act(async () => {
            await result.current.fetchTreinosRecentes(28);
        });

        expect(result.current.treinos).toEqual(TREINOS_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(AthleteProgressService.getTreinosRecentes).toHaveBeenCalledWith(28);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getTreinosRecentes).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteTreinosRecentes());
        await act(async () => {
            await result.current.fetchTreinosRecentes();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.treinos).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
