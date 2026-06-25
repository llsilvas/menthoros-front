import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachDashboard } from './useCoachDashboard';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachDashboard } from '../types/Coach';

vi.mock('../api/services/CoachDashboardService');

const DASHBOARD_STUB: CoachDashboard = {
    generatedAt: '2026-06-24T13:32:25Z',
    summary: {
        kpis: {
            totalAtletas: 24,
            ativos: 18,
            emAtencao: 5,
            pausados: 1,
            treinosPlanejadosSemana: 96,
        },
        atletasExibidos: 10,
        itensFilaAtencao: 3,
    },
    roster: {
        items: [
            {
                atletaId: 'a1',
                nome: 'Ana Silva',
                status: 'warning',
                weeklyVolume: 32.5,
            },
        ],
        page: 0,
        size: 10,
        totalElements: 24,
        totalPages: 3,
    },
    attentionQueue: [],
    calendar: {
        semanaInicio: '2026-06-23',
        semanaFim: '2026-06-29',
        treinos: [],
    },
    insights: {
        kpis: {
            totalAtletas: 24,
            ativos: 18,
            emAtencao: 5,
            pausados: 1,
            treinosPlanejadosSemana: 96,
        },
        tendenciaCargaSemanal: [],
        topAtletas: [],
    },
};

describe('useCoachDashboard', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula dashboard no sucesso', async () => {
        vi.mocked(CoachDashboardService.getDashboard).mockResolvedValue(DASHBOARD_STUB);

        const { result } = renderHook(() => useCoachDashboard());
        await act(async () => {
            await result.current.fetchDashboard();
        });

        expect(result.current.dashboard).toEqual(DASHBOARD_STUB);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('popula error na falha', async () => {
        vi.mocked(CoachDashboardService.getDashboard).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachDashboard());
        await act(async () => {
            await result.current.fetchDashboard();
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.dashboard).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('mantém loading=true durante a busca e false ao concluir', async () => {
        vi.mocked(CoachDashboardService.getDashboard).mockResolvedValue(DASHBOARD_STUB);

        const { result } = renderHook(() => useCoachDashboard());
        let pending!: Promise<void>;
        act(() => {
            pending = result.current.fetchDashboard();
        });
        expect(result.current.loading).toBe(true);

        await act(async () => {
            await pending;
        });
        expect(result.current.loading).toBe(false);
    });
});
