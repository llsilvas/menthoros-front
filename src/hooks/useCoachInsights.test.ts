import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachInsights } from './useCoachInsights';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachInsights } from '../types/Coach';

vi.mock('../api/services/CoachDashboardService');

describe('useCoachInsights', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula insights e repassa from/to no sucesso', async () => {
        const insights: CoachInsights = {
            kpis: { totalAtletas: 2, ativos: 1, emAtencao: 1, pausados: 0, treinosPlanejadosSemana: 4 },
            tendenciaCargaSemanal: [{ semana: '2026-W25', volumeTotalKm: 120, tssTotal: 900 }],
            topAtletas: [{ atletaId: '1', nome: 'Ana', volumeKm: 120 }],
        };
        vi.mocked(CoachDashboardService.getInsights).mockResolvedValue(insights);

        const { result } = renderHook(() => useCoachInsights());
        await act(async () => {
            await result.current.fetchInsights('2026-04-01', '2026-06-17');
        });

        expect(CoachDashboardService.getInsights).toHaveBeenCalledWith('2026-04-01', '2026-06-17');
        expect(result.current.insights).toEqual(insights);
        expect(result.current.error).toBeNull();
    });

    it('popula error na falha', async () => {
        vi.mocked(CoachDashboardService.getInsights).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachInsights());
        await act(async () => {
            await result.current.fetchInsights();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.insights).toBeNull();
    });
});
