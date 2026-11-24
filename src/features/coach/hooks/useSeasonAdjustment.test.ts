import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSeasonAdjustment } from './useSeasonAdjustment';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan, SeasonPlanDiffEntry } from '../../../types/SeasonPlan';

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

const DIFF: SeasonPlanDiffEntry[] = [
    { weekIndex: 2, field: 'targetVolumeKm', before: 42, after: 45, source: 'COACH' },
];

const apiError = (status: number, body: unknown) =>
    new ApiError({ method: 'POST', url: '' }, { url: '', ok: false, status, statusText: '', body }, 'erro');

describe('useSeasonAdjustment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue(DRAFT);
        vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue(DIFF);
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

    it('409 ao aprovar liga o conflito e não devolve temporada', async () => {
        vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(409, { message: 'A temporada ativa mudou' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let aprovada: SeasonPlan | null = DRAFT;
        await act(async () => { aprovada = await result.current.approve('motivo'); });

        expect(aprovada).toBeNull();
        expect(result.current.approveConflict).toBe(true);
        expect(result.current.approveError).toBeNull();
    });

    it('422 ao aprovar expõe a mensagem, sem conflito', async () => {
        vi.mocked(SeasonPlanService.aprovar).mockRejectedValue(apiError(422, { message: 'Informe o motivo' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        await act(async () => { await result.current.approve('motivo'); });

        expect(result.current.approveConflict).toBe(false);
        expect(result.current.approveError?.message).toBe('Informe o motivo');
    });

    it('carrega o diff junto com o rascunho', async () => {
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));

        await waitFor(() => expect(result.current.diff).toEqual(DIFF));
        expect(SeasonPlanService.buscarDiff).toHaveBeenCalledWith('a1', 'v2');
    });

    it('temporada fora de ajuste não pede o diff', async () => {
        vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue({ ...DRAFT, seasonStatus: 'ACTIVE' });
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));

        await waitFor(() => expect(result.current.plan).not.toBeNull());
        expect(SeasonPlanService.buscarDiff).not.toHaveBeenCalled();
        expect(result.current.diff).toEqual([]);
    });

    it('falha no diff não derruba o ajuste', async () => {
        vi.mocked(SeasonPlanService.buscarDiff).mockRejectedValue(apiError(500, {}));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));

        await waitFor(() => expect(result.current.diffError).not.toBeNull());
        expect(result.current.plan).toEqual(DRAFT);
        expect(result.current.loadError).toBeNull();
    });

    it('salvar a semana relê o diff', async () => {
        vi.mocked(SeasonPlanService.atualizarSemana).mockResolvedValue(DRAFT);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.diff).toEqual(DIFF));
        const novo: SeasonPlanDiffEntry[] = [...DIFF, { weekIndex: 2, field: 'deload', before: false, after: true, source: 'COACH' }];
        vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue(novo);

        await act(async () => { await result.current.saveWeek(2, { deload: true }); });

        await waitFor(() => expect(result.current.diff).toEqual(novo));
        expect(SeasonPlanService.buscarDiff).toHaveBeenCalledTimes(2);
    });

    it('falha ao reler o diff limpa o diff anterior', async () => {
        vi.mocked(SeasonPlanService.atualizarSemana).mockResolvedValue(DRAFT);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.diff).toEqual(DIFF));
        vi.mocked(SeasonPlanService.buscarDiff).mockRejectedValue(apiError(500, {}));

        await act(async () => { await result.current.saveWeek(2, { deload: true }); });

        await waitFor(() => expect(result.current.diffError).not.toBeNull());
        expect(result.current.diff).toEqual([]);
    });

    it('recalcular troca o rascunho e relê o diff', async () => {
        const recalculado = { ...DRAFT, initialVolumeKm: 40 };
        vi.mocked(SeasonPlanService.recalcular).mockResolvedValue(recalculado);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.diff).toEqual(DIFF));
        vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue([]);
        const input = { phaseWeeks: { BASE: 1, BUILD: 0, PEAK: 0, TAPER: 0 }, startVolumeKm: 40 };

        let ok = false;
        await act(async () => { ok = await result.current.recalculate(input); });

        expect(ok).toBe(true);
        expect(SeasonPlanService.recalcular).toHaveBeenCalledWith('a1', 'v2', input);
        expect(result.current.plan?.initialVolumeKm).toBe(40);
        await waitFor(() => expect(result.current.diff).toEqual([]));
    });

    it('422 ao recalcular expõe a mensagem e mantém o rascunho', async () => {
        vi.mocked(SeasonPlanService.recalcular).mockRejectedValue(apiError(422, { message: 'A soma das fases dá 10 semanas' }));
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let ok = true;
        await act(async () => {
            ok = await result.current.recalculate({ phaseWeeks: { BASE: 9, BUILD: 0, PEAK: 0, TAPER: 0 }, startVolumeKm: 40 });
        });

        expect(ok).toBe(false);
        expect(result.current.recalcError?.message).toBe('A soma das fases dá 10 semanas');
        expect(result.current.plan).toEqual(DRAFT);
    });

    it('diff de um rascunho anterior não sobrescreve o atual', async () => {
        let resolver: (d: SeasonPlanDiffEntry[]) => void = () => {};
        vi.mocked(SeasonPlanService.buscarDiff).mockImplementationOnce(
            () => new Promise<SeasonPlanDiffEntry[]>((r) => { resolver = r; }) as never);
        const { result, rerender } = renderHook(({ id }) => useSeasonAdjustment('a1', id), { initialProps: { id: 'v2' } });
        await waitFor(() => expect(SeasonPlanService.buscarDiff).toHaveBeenCalledTimes(1));

        vi.mocked(SeasonPlanService.buscarPorId).mockResolvedValue({ ...DRAFT, id: 'v3' });
        vi.mocked(SeasonPlanService.buscarDiff).mockResolvedValue([]);
        rerender({ id: 'v3' });
        await waitFor(() => expect(result.current.plan?.id).toBe('v3'));
        await act(async () => { resolver(DIFF); });

        expect(result.current.diff).toEqual([]);
    });

    it('recomeçar descarta, abre ajuste da ativa atual e devolve o id novo', async () => {
        vi.mocked(SeasonPlanService.descartar).mockResolvedValue(undefined);
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue({ ...DRAFT, id: 'v3', seasonStatus: 'ACTIVE', version: 3 });
        vi.mocked(SeasonPlanService.criarAjuste).mockResolvedValue({ ...DRAFT, id: 'v4', version: 4, baseSeasonPlanId: 'v3' });
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let novo: string | null = null;
        await act(async () => { novo = await result.current.restart(); });

        expect(novo).toBe('v4');
        expect(SeasonPlanService.descartar).toHaveBeenCalledWith('a1', 'v2');
        expect(SeasonPlanService.criarAjuste).toHaveBeenCalledWith('a1', 'v3');
    });

    it('recomeçar segue quando o rascunho já tinha sido descartado (409)', async () => {
        vi.mocked(SeasonPlanService.descartar).mockRejectedValue(apiError(409, { message: 'já descartado' }));
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue({ ...DRAFT, id: 'v3', seasonStatus: 'ACTIVE' });
        vi.mocked(SeasonPlanService.criarAjuste).mockResolvedValue({ ...DRAFT, id: 'v4' });
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let novo: string | null = null;
        await act(async () => { novo = await result.current.restart(); });

        expect(novo).toBe('v4');
    });

    it('recomeçar sem ativa expõe o erro', async () => {
        vi.mocked(SeasonPlanService.descartar).mockResolvedValue(undefined);
        vi.mocked(SeasonPlanService.buscarAtual).mockResolvedValue(undefined);
        const { result } = renderHook(() => useSeasonAdjustment('a1', 'v2'));
        await waitFor(() => expect(result.current.plan).not.toBeNull());

        let novo: string | null = 'x';
        await act(async () => { novo = await result.current.restart(); });

        expect(novo).toBeNull();
        expect(result.current.restartError?.message).toBe('O atleta não tem temporada ativa para ajustar');
        expect(SeasonPlanService.criarAjuste).not.toHaveBeenCalled();
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
