import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteAderencia } from './useAthleteAderencia';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteAderencia } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const ADERENCIA_STUB: AthleteAderencia[] = [
    { semanaInicio: '2026-06-01', totalPlanejado: 5, totalRealizado: 4, percentual: 80 },
];

describe('useAthleteAderencia', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula aderencia no sucesso', async () => {
        vi.mocked(AthleteProgressService.getAderencia).mockResolvedValue(ADERENCIA_STUB);

        const { result } = renderHook(() => useAthleteAderencia());
        await act(async () => {
            await result.current.fetchAderencia(4);
        });

        expect(result.current.aderencia).toEqual(ADERENCIA_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(AthleteProgressService.getAderencia).toHaveBeenCalledWith(4);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getAderencia).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteAderencia());
        await act(async () => {
            await result.current.fetchAderencia();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.aderencia).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
