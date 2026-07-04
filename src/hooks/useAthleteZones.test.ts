import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteZones } from './useAthleteZones';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteZones } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const ZONES_STUB: AthleteZones = { z1: 600, z2: 0, z3: 300, z4: 0, z5: 0, duracaoTotalSegundos: 900 };

describe('useAthleteZones', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula zones no sucesso', async () => {
        vi.mocked(AthleteProgressService.getZonas).mockResolvedValue(ZONES_STUB);

        const { result } = renderHook(() => useAthleteZones());
        await act(async () => {
            await result.current.fetchZones();
        });

        expect(result.current.zones).toEqual(ZONES_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getZonas).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthleteZones());
        await act(async () => {
            await result.current.fetchZones();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.zones).toBeNull();
        expect(result.current.loading).toBe(false);
    });
});
