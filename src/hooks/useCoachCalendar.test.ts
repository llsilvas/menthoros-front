import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachCalendar } from './useCoachCalendar';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachCalendario } from '../types/Coach';

vi.mock('../api/services/CoachDashboardService');

describe('useCoachCalendar', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula calendario e repassa from no sucesso', async () => {
        const calendario: CoachCalendario = {
            semanaInicio: '2026-06-15',
            semanaFim: '2026-06-21',
            treinos: [],
        };
        vi.mocked(CoachDashboardService.getCalendario).mockResolvedValue(calendario);

        const { result } = renderHook(() => useCoachCalendar());
        await act(async () => {
            await result.current.fetchCalendario('2026-06-15');
        });

        expect(CoachDashboardService.getCalendario).toHaveBeenCalledWith('2026-06-15');
        expect(result.current.calendario).toEqual(calendario);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(CoachDashboardService.getCalendario).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachCalendar());
        await act(async () => {
            await result.current.fetchCalendario();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.calendario).toBeNull();
    });
});
