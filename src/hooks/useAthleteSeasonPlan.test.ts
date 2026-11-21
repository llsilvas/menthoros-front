import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteSeasonPlan } from './useAthleteSeasonPlan';
import { SeasonPlanService } from '../api/services/SeasonPlanService';
import type { AthleteSeasonPlan } from '../types/SeasonPlan';

vi.mock('../api/services/SeasonPlanService');

const SEASON: AthleteSeasonPlan = {
    raceName: 'Maratona SP', raceDate: '2027-04-04', daysToRace: 139, currentPhase: 'BASE', upcomingMilestones: [],
    distance: { value: '42K', label: '42 km (Maratona)', short: '42K', order: 5 },
};

describe('useAthleteSeasonPlan', () => {
    beforeEach(() => vi.clearAllMocks());

    it('200 expõe a temporada', async () => {
        vi.mocked(SeasonPlanService.buscarMinha).mockResolvedValue(SEASON);
        const { result } = renderHook(() => useAthleteSeasonPlan());

        await act(async () => { await result.current.fetchSeason(); });
        expect(result.current.season).toEqual(SEASON);
        expect(result.current.error).toBeNull();
    });

    it('204 = sem temporada, sem erro', async () => {
        vi.mocked(SeasonPlanService.buscarMinha).mockResolvedValue(undefined);
        const { result } = renderHook(() => useAthleteSeasonPlan());

        await act(async () => { await result.current.fetchSeason(); });
        expect(result.current.season).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('falha expõe o erro e nenhuma temporada', async () => {
        vi.mocked(SeasonPlanService.buscarMinha).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useAthleteSeasonPlan());

        await act(async () => { await result.current.fetchSeason(); });
        expect(result.current.error?.message).toBe('boom');
        expect(result.current.season).toBeNull();
    });
});
