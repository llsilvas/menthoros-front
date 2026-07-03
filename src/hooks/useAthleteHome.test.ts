import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteHome } from './useAthleteHome';
import { AthleteHomeService } from '../api/services/AthleteHomeService';
import type { AthleteHome } from '../types/AthleteHome';

vi.mock('../api/services/AthleteHomeService');

const HOME_STUB: AthleteHome = {
    proximoTreino: { data: '2026-07-04', tipoTreino: 'INTERVALADO', descricao: 'Tiros de 400m' },
    metricasChave: { ctl: 52.3, atl: 44.0, tsb: 8.3, tss: 0, volumeKm: 12.5, statusForma: 'FORMA_IDEAL' },
};

describe('useAthleteHome', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula home no sucesso', async () => {
        vi.mocked(AthleteHomeService.getHome).mockResolvedValue(HOME_STUB);

        const { result } = renderHook(() => useAthleteHome());
        await act(async () => {
            await result.current.fetchHome();
        });

        expect(result.current.home).toEqual(HOME_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteHomeService.getHome).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteHome());
        await act(async () => {
            await result.current.fetchHome();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.home).toBeNull();
        expect(result.current.loading).toBe(false);
    });
});
