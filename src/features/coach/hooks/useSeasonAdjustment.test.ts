import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSeasonAdjustment } from './useSeasonAdjustment';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan } from '../../../types/SeasonPlan';

vi.mock('../../../api/services/SeasonPlanService');

const DRAFT: SeasonPlan = {
    id: 'v2', seasonStatus: 'PROPOSED', provaId: 'p1', provaNome: 'Maratona SP', provaData: '2027-04-04',
    shortPreparation: false, totalWeeks: 2, initialCtl: 40, peakVolumeKm: 50, version: 2, baseSeasonPlanId: 'v1',
    weeks: [
        { weekIndex: 1, weekStart: '2026-11-16', phase: 'BASE', targetVolumeKm: 40, targetTss: 300, deload: false, valueSource: 'ENGINE', locked: true, lockReason: 'IN_PROGRESS' },
        { weekIndex: 2, weekStart: '2026-11-23', phase: 'BASE', targetVolumeKm: 42, targetTss: 310, deload: false, valueSource: 'ENGINE', locked: false },
    ],
    milestones: [], validations: [],
};

const apiError = (status: number, body: unknown) =>
    new ApiError({ method: 'POST', url: '' }, { url: '', ok: false, status, statusText: '', body }, 'erro');

describe('useSeasonAdjustment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue(DRAFT);
    });

    it('carrega o ajuste pelo id', async () => {
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));

        await waitFor(() => expect(result.current.plan).toEqual(DRAFT));
        expect(SeasonPlanService.buscarPorId).toHaveBeenCalledWith('a1', 'v2');
    });

    it('salvar a semana troca a temporada pela resposta', async () => {
        const salva = { ...DRAFT, peakVolumeKm: 55 };
        vi.mocked(SeasonPlanService.atualizarSemana).mockResolvedValue(salva);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let ok = false;
        await act(async () => { ok = await result.current.saveWeek(2, { targetVolumeKm: 55 }); });

        expect(ok).toBe(true);
        expect(SeasonPlanService.atualizarSemana).toHaveBeenCalledWith('a1', 'v2', 2, { targetVolumeKm: 55 });
        expect(result.current.plan?.peakVolumeKm).toBe(55);
        expect(result.current.savingWeek).toBeNull();
    });

    it('422 ao salvar expõe a mensagem do backend', async () => {
        vi.mocked(SeasonPlanService.atualizarSemana).mockRejectedValue(apiError(422, { message: 'A semana 1 está em andamento' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let ok = true;
        await act(async () => { ok = await result.current.saveWeek(1, { deload: true }); });

        expect(ok).toBe(false);
        expect(result.current.saveError?.message).toBe('A semana 1 está em andamento');
    });

    it('aprovar manda o motivo sem espaços nas pontas e devolve a temporada aprovada', async () => {
        vi.mocked(SeasonPlanService.aprovar).mockResolvedValue({ ...DRAFT, seasonStatus: 'ACTIVE' });
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let aprovada: SeasonPlan | null = null;
        await act(async () => { aprovada = await result.current.approve('  Atleta lesionou  '); });

        expect(SeasonPlanService.aprovar).toHaveBeenCalledWith('a1', 'v2', 'Atleta lesionou');
        expect(aprovada).not.toBeNull();
        // A página navega; a temporada exibida não vira ACTIVE (sem piscar "já aprovado").
        expect(result.current.plan?.seasonStatus).toBe('PROPOSED');
    });

    it('resposta do salvar de um rascunho anterior não sobrescreve o atual', async () => {
        let resolver: (p: SeasonPlan) => void = () => {};
        vi.mocked(SeasonPlanService.atualizarSemana).mockImplementationOnce(
            () => new Promise<SeasonPlan>((r) => { resolver = r; }) as never);
        const outro = { ...DRAFT, id: 'v3' };
        const { result, rerender } = renderHook(({ id }) => useSeasonAdjustment('a1', id), { initialProps: { id: 'v2' } });
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let salvando: Promise<boolean> = Promise.resolve(false);
        act(() => { salvando = result.current.saveWeek(2, { targetVolumeKm: 55 }); });
        vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue(outro);
        rerender({ id: 'v3' });
        await waitFor(() => expect(result.current.plan?.id).toBe('v3'));
        let ok = true;
        await act(async () => { resolver({ ...DRAFT, peakVolumeKm: 99 }); ok = await salvando; });

        expect(ok).toBe(false);
        expect(result.current.plan?.id).toBe('v3');
    });

    it('409 ao aprovar expõe o erro e não devolve temporada', async () => {
        vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(409, { message: 'A temporada ativa mudou' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let aprovada: SeasonPlan | null = DRAFT;
        await act(async () => { aprovada = await result.current.approve('motivo'); });

        expect(aprovada).toBeNull();
        expect(result.current.approveError?.message).toBe('A temporada ativa mudou');
    });

    it('descartar chama o DELETE e devolve true', async () => {
        vi.mocked(SeasonPlanService.descartar).mockResolvedValue(undefined);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let ok = false;
        await act(async () => { ok = await result.current.discard(); });

        expect(ok).toBe(true);
        expect(SeasonPlanService.descartar).toHaveBeenCalledWith('a1', 'v2');
    });

    it('falha ao carregar expõe loadError', async () => {
        vi.mocked(SeasonPlanService.buscarPorId).mockRejectedValue(apiError(404, { message: 'Temporada não encontrada' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));

        await waitFor(() => expect(result.current.loadError?.message).toBe('Temporada não encontrada'));
    });
});
