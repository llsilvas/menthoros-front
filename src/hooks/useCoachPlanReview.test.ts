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

// Configura listarPorStatus para retornar STUB apenas em AGUARDANDO_REVISAO
function mockFetchAguardando(stub: PlanoSemanalDto = STUB) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(CoachPlanoReviewService.listarPorStatus).mockImplementation((status) =>
        Promise.resolve(status === 'AGUARDANDO_REVISAO' ? [stub] : []) as any
    );
}

// Configura listarPorStatus para retornar lista vazia em todos os statuses
function mockFetchVazio() {
    vi.mocked(CoachPlanoReviewService.listarPorStatus).mockResolvedValue([]);
}

describe('useCoachPlanReview', () => {
    beforeEach(() => vi.clearAllMocks());

    it('popula pendentes (AGUARDANDO_REVISAO) no sucesso', async () => {
        mockFetchAguardando();

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.pendentes).toHaveLength(1);
        expect(result.current.pendentes[0].id).toBe('plano-1');
        expect(result.current.fetchError).toBeNull();
        expect(result.current.isFetching).toBe(false);
    });

    it('retorna lista vazia quando não há planos no filtro ativo', async () => {
        mockFetchVazio();

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.pendentes).toEqual([]);
        expect(result.current.fetchError).toBeNull();
    });

    it('popula fetchError na falha de listagem', async () => {
        vi.mocked(CoachPlanoReviewService.listarPorStatus).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        expect(result.current.fetchError).toBeInstanceOf(Error);
        expect(result.current.pendentes).toEqual([]);
        expect(result.current.isFetching).toBe(false);
    });

    it('mantém isFetching=true durante busca e false ao concluir', async () => {
        mockFetchVazio();

        const { result } = renderHook(() => useCoachPlanReview());
        let pending!: Promise<void>;
        act(() => { pending = result.current.fetchPendentes(); });
        expect(result.current.isFetching).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.isFetching).toBe(false);
    });

    it('remove plano do filtro AGUARDANDO após aprovar (refetch)', async () => {
        // Primeiro fetch: STUB em AGUARDANDO
        // Após aprovação, refetch retorna lista vazia (plano virou APROVADO)
        vi.mocked(CoachPlanoReviewService.listarPorStatus)
            .mockResolvedValueOnce([STUB])  // AGUARDANDO — primeiro fetchAll
            .mockResolvedValueOnce([])       // APROVADO   — primeiro fetchAll
            .mockResolvedValueOnce([])       // REJEITADO  — primeiro fetchAll
            .mockResolvedValue([]);          // todos statuses após approve

        vi.mocked(CoachPlanoReviewService.aprovar).mockResolvedValue({ ...STUB, reviewStatus: 'APROVADO' });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });
        expect(result.current.pendentes).toHaveLength(1);

        await act(async () => { await result.current.aprovar('plano-1'); });

        expect(result.current.pendentes).toHaveLength(0);
        expect(result.current.isActing).toBe(false);
    });

    it('remove plano do filtro AGUARDANDO após rejeitar (refetch)', async () => {
        vi.mocked(CoachPlanoReviewService.listarPorStatus)
            .mockResolvedValueOnce([STUB])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValue([]);

        vi.mocked(CoachPlanoReviewService.rejeitar).mockResolvedValue({
            ...STUB, reviewStatus: 'REJEITADO', reviewComment: 'Volume excessivo',
        });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });
        expect(result.current.pendentes).toHaveLength(1);

        await act(async () => { await result.current.rejeitar('plano-1', 'Volume excessivo'); });

        expect(result.current.pendentes).toHaveLength(0);
        expect(result.current.isActing).toBe(false);
    });

    it('mantém isActing=true durante ação e false ao concluir', async () => {
        mockFetchAguardando();
        vi.mocked(CoachPlanoReviewService.aprovar).mockResolvedValue({ ...STUB, reviewStatus: 'APROVADO' });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        let pending!: Promise<void>;
        act(() => { pending = result.current.aprovar('plano-1'); });
        expect(result.current.isActing).toBe(true);
        await act(async () => { await pending; });
        expect(result.current.isActing).toBe(false);
    });

    it('popula actionError quando aprovar falha', async () => {
        vi.mocked(CoachPlanoReviewService.aprovar).mockRejectedValue(new Error('servidor indisponível'));

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.aprovar('plano-1'); });

        expect(result.current.actionError).toBeInstanceOf(Error);
        expect(result.current.actionError?.message).toContain('servidor indisponível');
        expect(result.current.isActing).toBe(false);
    });

    it('popula actionError quando rejeitar falha', async () => {
        vi.mocked(CoachPlanoReviewService.rejeitar).mockRejectedValue(new Error('timeout'));

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.rejeitar('plano-1', 'motivo'); });

        expect(result.current.actionError).toBeInstanceOf(Error);
        expect(result.current.actionError?.message).toContain('timeout');
        expect(result.current.isActing).toBe(false);
    });

    it('reseta actionError no início de uma nova ação', async () => {
        mockFetchVazio();
        vi.mocked(CoachPlanoReviewService.aprovar)
            .mockRejectedValueOnce(new Error('erro anterior'))
            .mockResolvedValueOnce({ ...STUB, reviewStatus: 'APROVADO' });

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.aprovar('plano-1'); });
        expect(result.current.actionError).toBeInstanceOf(Error);

        await act(async () => { await result.current.aprovar('plano-1'); });
        expect(result.current.actionError).toBeNull();
    });

    it('setFilter muda o filtro ativo e a vista filtrada', async () => {
        const aprovado: PlanoSemanalDto = { ...STUB, reviewStatus: 'APROVADO' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(CoachPlanoReviewService.listarPorStatus).mockImplementation((status) =>
            Promise.resolve(status === 'APROVADO' ? [aprovado] : []) as any
        );

        const { result } = renderHook(() => useCoachPlanReview());
        await act(async () => { await result.current.fetchPendentes(); });

        // Filtro padrão: AGUARDANDO_REVISAO → vazio
        expect(result.current.activeFilter).toBe('AGUARDANDO_REVISAO');
        expect(result.current.pendentes).toHaveLength(0);

        // Muda para APROVADO → mostra o plano aprovado
        act(() => { result.current.setFilter('APROVADO'); });
        expect(result.current.activeFilter).toBe('APROVADO');
        expect(result.current.pendentes).toHaveLength(1);
        expect(result.current.pendentes[0].reviewStatus).toBe('APROVADO');
    });
});
