import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachRoster } from './useCoachRoster';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachAtletaResumo } from '../types/Coach';

vi.mock('../api/services/CoachDashboardService');

describe('useCoachRoster', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula roster no sucesso', async () => {
        const roster: CoachAtletaResumo[] = [
            { atletaId: '1', nome: 'Ana Silva', status: 'active', weeklyVolume: 32.5 },
        ];
        vi.mocked(CoachDashboardService.getRoster).mockResolvedValue(roster);

        const { result } = renderHook(() => useCoachRoster());
        await act(async () => {
            await result.current.fetchRoster();
        });

        expect(result.current.roster).toEqual(roster);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(CoachDashboardService.getRoster).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachRoster());
        await act(async () => {
            await result.current.fetchRoster();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.roster).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('mantém loading=true durante a busca e false ao concluir', async () => {
        vi.mocked(CoachDashboardService.getRoster).mockResolvedValue([]);

        const { result } = renderHook(() => useCoachRoster());
        let pending!: Promise<void>;
        act(() => {
            pending = result.current.fetchRoster();
        });
        expect(result.current.loading).toBe(true);

        await act(async () => {
            await pending;
        });
        expect(result.current.loading).toBe(false);
    });
});
