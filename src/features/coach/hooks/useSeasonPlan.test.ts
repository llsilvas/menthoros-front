import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSeasonPlan } from './useSeasonPlan';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan } from '../../../types/SeasonPlan';

vi.mock('../../../api/services/SeasonPlanService');

const PLAN: SeasonPlan = {
    id: 's1', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
    shortPreparation: false, totalWeeks: 1, initialCtl: 40, peakVolumeKm: 50,
    weeks: [{ weekIndex: 1, weekStart: '2027-03-29', phase: 'RACE_WEEK', targetVolumeKm: 20, targetTss: 164, deload: false, valueSource: 'ENGINE' }],
    milestones: [], validations: [],
};

const apiError = (status: number, body: unknown) =>
    new ApiError({ method: 'GET', url: '' }, { url: '', ok: false, status, statusText: '', body }, 'erro');

describe('useSeasonPlan', () => {
    beforeEach(() => vi.clearAllMocks());

    it('200 expõe a temporada', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(PLAN);
        const { result } = renderHook(() => useSeasonPlan('a1'));

        await waitFor(() => expect(result.current.plan).toEqual(PLAN));
        expect(result.current.disabled).toBe(false);
        expect(SeasonPlanService.buscarAtual).toHaveBeenCalledWith('a1');
    });

    it('204 = sem temporada, sem erro', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(undefined);
        const { result } = renderHook(() => useSeasonPlan('a1'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.plan).toBeNull();
        expect(result.current.loadError).toBeNull();
    });

    it('404 com SEASON_PLAN_DISABLED marca disabled, sem erro', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockRejectedValue(apiError(404, { code: 'SEASON_PLAN_DISABLED' }));
        const { result } = renderHook(() => useSeasonPlan('a1'));

        await waitFor(() => expect(result.current.disabled).toBe(true));
        expect(result.current.loadError).toBeNull();
    });

    it('404 comum é erro, não disabled', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockRejectedValue(apiError(404, { message: 'Atleta não encontrado' }));
        const { result } = renderHook(() => useSeasonPlan('a1'));

        await waitFor(() => expect(result.current.loadError?.message).toBe('Atleta não encontrado'));
        expect(result.current.disabled).toBe(false);
    });

    it('falha de rede expõe error', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useSeasonPlan('a1'));

        await waitFor(() => expect(result.current.loadError?.message).toBe('boom'));
    });

    it('generate grava a proposta; 422 mostra a mensagem do backend', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(undefined);
        vi.mocked(SeasonPlanService.gerar).mockRejectedValueOnce(apiError(422, { message: 'Atleta sem prova-alvo' }));
        const { result } = renderHook(() => useSeasonPlan('a1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => { await result.current.generate(); });
        expect(result.current.generateError?.message).toBe('Atleta sem prova-alvo');

        vi.mocked(SeasonPlanService.gerar).mockResolvedValueOnce(PLAN);
        await act(async () => { await result.current.generate(); });
        expect(result.current.plan).toEqual(PLAN);
        expect(result.current.generateError).toBeNull();
        expect(result.current.generating).toBe(false);
    });

    it('approve troca a proposta pela aprovada; 422 mostra a mensagem do backend', async () => {
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(PLAN);
        vi.mocked(SeasonPlanService.aprovar).mockRejectedValueOnce(apiError(422, { message: 'Prova cancelada' }));
        const { result } = renderHook(() => useSeasonPlan('a1'));
        await waitFor(() => expect(result.current.plan).toEqual(PLAN));

        await act(async () => { await result.current.approve(); });
        expect(result.current.approveError?.message).toBe('Prova cancelada');
        expect(result.current.plan).toEqual(PLAN);

        const aprovada = { ...PLAN, seasonStatus: 'ACTIVE' as const, approvedAt: '2026-11-20T13:00:00Z' };
        vi.mocked(SeasonPlanService.aprovar).mockResolvedValueOnce(aprovada);
        await act(async () => { await result.current.approve(); });
        expect(SeasonPlanService.aprovar).toHaveBeenLastCalledWith('a1', 's1');
        expect(result.current.plan).toEqual(aprovada);
        expect(result.current.approveError).toBeNull();
        expect(result.current.approving).toBe(false);
    });

    it('aprovação superada por A → B → A relê a temporada de A', async () => {
        let resolveAprovar: (p: SeasonPlan) => void = () => {};
        vi.mocked(SeasonPlanService.aprovar).mockImplementationOnce(
            () => new Promise<SeasonPlan>((r) => { resolveAprovar = r; }) as never);
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(PLAN);
        const { result, rerender } = renderHook(({ id }) => useSeasonPlan(id), { initialProps: { id: 'a1' } });
        await waitFor(() => expect(result.current.plan).toEqual(PLAN));

        let aprovando: Promise<void> = Promise.resolve();
        act(() => { aprovando = result.current.approve(); });
        rerender({ id: 'b1' });
        rerender({ id: 'a1' });
        await waitFor(() => expect(result.current.loading).toBe(false));
        const aprovada = { ...PLAN, seasonStatus: 'ACTIVE' as const };
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(aprovada);
        await act(async () => { resolveAprovar(aprovada); await aprovando; });

        await waitFor(() => expect(result.current.plan).toEqual(aprovada));
    });

    it('resposta atrasada do atleta anterior não sobrescreve a do atual', async () => {
        let resolveA: (p: SeasonPlan) => void = () => {};
        vi.mocked(SeasonPlanService.buscarAtual)
            .mockImplementationOnce(() => new Promise<SeasonPlan>((r) => { resolveA = r; }) as never)
            .mockResolvedValueOnce(undefined);
        const { result, rerender } = renderHook(({ id }) => useSeasonPlan(id), { initialProps: { id: 'a1' } });

        rerender({ id: 'b1' });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => { resolveA(PLAN); });

        expect(result.current.plan).toBeNull();
    });

    it('sem atletaId não chama o backend', () => {
        renderHook(() => useSeasonPlan(undefined));
        expect(SeasonPlanService.buscarAtual).not.toHaveBeenCalled();
    });
});
