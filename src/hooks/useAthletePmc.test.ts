import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthletePmc } from './useAthletePmc';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthletePmc } from '../types/AthleteProgress';

vi.mock('../api/services/AthleteProgressService');

const PMC_STUB: AthletePmc[] = [
    { data: '2026-06-01', ctl: 50, atl: 60, tsb: -10, tss: 80, statusForma: 'ACUMULANDO_FADIGA' },
];

describe('useAthletePmc', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula pmc no sucesso', async () => {
        vi.mocked(AthleteProgressService.getPmcHistorico).mockResolvedValue(PMC_STUB);

        const { result } = renderHook(() => useAthletePmc());
        await act(async () => {
            await result.current.fetchPmc();
        });

        expect(result.current.pmc).toEqual(PMC_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(AthleteProgressService.getPmcHistorico).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useAthletePmc());
        await act(async () => {
            await result.current.fetchPmc();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.pmc).toEqual([]);
        expect(result.current.loading).toBe(false);
    });
});
