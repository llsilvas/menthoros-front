import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachPlanReview } from './useCoachPlanReview';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { PlanoSemanalDto } from '../types/PlanoReview';

vi.mock('../api/services/CoachPlanoReviewService');

const STUB: PlanoSemanalDto = {
    id: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    volumePlanejadoKm: 45,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 45,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
};

describe('useCoachPlanReview', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula pendentes no sucesso', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([STUB]);

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.pendentes).toHaveLength(1);
        expect(result.current.pendentes[0].id).toBe('plano-1');
        expect(result.current.fetchError).toBeNull();
        expect(result.current.isFetching).toBe(false);
    });

    it('retorna lista vazia quando não há pendentes', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([]);

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.pendentes).toEqual([]);
        expect(result.current.fetchError).toBeNull();
    });

    it('popula fetchError na falha de listagem', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.fetchError).toBeInstanceOf(Error);
        expect(result.current.pendentes).toEqual([]);
        expect(result.current.isFetching).toBe(false);
    });

    it('mantém isFetching=true durante busca e false ao concluir', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([]);

        const { result } = renderHook(() => useCoachPlanReview());
        let pending!: Promise<void>;
        act(() => { pending = result.current.fetchPendentes(); });
        expect(result.current.isFetching).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.isFetching).toBe(false);
    });

    it('remove plano da lista após aprovar', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([STUB]);
        vi.mocked(CoachPlanoReviewService.aprovar).mockResolvedValue({ ...STUB, reviewStatus: 'APROVADO' });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });
        expect(result.current.pendentes).toHaveLength(1);

        await act(async () => { await result.current.aprovar('plano-1'); });

        expect(result.current.pendentes).toHaveLength(0);
        expect(result.current.isActing).toBe(false);
    });

    it('remove plano da lista após rejeitar', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([STUB]);
        vi.mocked(CoachPlanoReviewService.rejeitar).mockResolvedValue({
            ...STUB,
            reviewStatus: 'REJEITADO',
            reviewComment: 'Volume excessivo',
        });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });
        expect(result.current.pendentes).toHaveLength(1);

        await act(async () => { await result.current.rejeitar('plano-1', 'Volume excessivo'); });

        expect(result.current.pendentes).toHaveLength(0);
        expect(result.current.isActing).toBe(false);
    });

    it('mantém isActing=true durante ação e false ao concluir', async () => {
        vi.mocked(CoachPlanoReviewService.listarPendentes).mockResolvedValue([STUB]);
        vi.mocked(CoachPlanoReviewService.aprovar).mockResolvedValue({ ...STUB, reviewStatus: 'APROVADO' });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        let pending!: Promise<void>;
        act(() => { pending = result.current.aprovar('plano-1'); });
        expect(result.current.isActing).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.isActing).toBe(false);
    });
});
