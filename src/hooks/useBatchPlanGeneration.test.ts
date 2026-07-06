import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBatchPlanGeneration } from './useBatchPlanGeneration';
import { BatchPlanService } from '../api/services/BatchPlanService';
import type { BatchPlanJobStatus } from '../types/BatchPlanJob';

vi.mock('../api/services/BatchPlanService');

const statusBase = (over: Partial<BatchPlanJobStatus>): BatchPlanJobStatus => ({
    jobId: 'job-1',
    status: 'EM_PROGRESSO',
    totalAtletas: 2,
    gerados: 0,
    erros: 0,
    geradosDetalhes: [],
    errosDetalhes: [],
    ...over,
});

describe('useBatchPlanGeneration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });

    it('dispara o lote e inicia o polling (leitura imediata do status)', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockResolvedValue({ jobId: 'job-1', totalAtletas: 2 });
        vi.mocked(BatchPlanService.consultarStatus).mockResolvedValue(statusBase({ gerados: 1 }));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await result.current.gerarLote(['a1', 'a2']);
        });
        await flush();

        expect(BatchPlanService.gerarEmLote).toHaveBeenCalledWith(['a1', 'a2'], 'PROXIMA_SEMANA');
        expect(result.current.jobId).toBe('job-1');
        expect(BatchPlanService.consultarStatus).toHaveBeenCalledWith('job-1');
        expect(result.current.status?.gerados).toBe(1);
    });

    it('para o polling quando o status fica terminal (CONCLUIDO)', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockResolvedValue({ jobId: 'job-1', totalAtletas: 1 });
        vi.mocked(BatchPlanService.consultarStatus)
            .mockResolvedValueOnce(statusBase({ status: 'EM_PROGRESSO', totalAtletas: 1 }))
            .mockResolvedValueOnce(statusBase({ status: 'CONCLUIDO', totalAtletas: 1, gerados: 1 }));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await result.current.gerarLote(['a1']);
        });
        await flush(); // leitura imediata → EM_PROGRESSO

        await act(async () => { await vi.advanceTimersByTimeAsync(3000); }); // 1º poll → CONCLUIDO

        expect(result.current.status?.status).toBe('CONCLUIDO');
        expect(result.current.loading).toBe(false);

        const chamadasAteAqui = vi.mocked(BatchPlanService.consultarStatus).mock.calls.length;
        await act(async () => { await vi.advanceTimersByTimeAsync(9000); }); // não deve mais pollar
        expect(vi.mocked(BatchPlanService.consultarStatus).mock.calls.length).toBe(chamadasAteAqui);
    });

    it('seta error quando o disparo falha (rede)', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockRejectedValue(new Error('500'));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await expect(result.current.gerarLote(['a1'])).rejects.toThrow('500');
        });

        expect(result.current.error).toBe('500');
        expect(result.current.loading).toBe(false);
    });

    it('reset limpa jobId, status e error', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockResolvedValue({ jobId: 'job-1', totalAtletas: 1 });
        vi.mocked(BatchPlanService.consultarStatus).mockResolvedValue(statusBase({ totalAtletas: 1 }));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await result.current.gerarLote(['a1']);
        });
        await flush();

        act(() => result.current.reset());

        expect(result.current.jobId).toBeNull();
        expect(result.current.status).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('seta error de timeout e para o polling quando o job não termina a tempo', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockResolvedValue({ jobId: 'job-1', totalAtletas: 1 });
        vi.mocked(BatchPlanService.consultarStatus).mockResolvedValue(statusBase({ status: 'EM_PROGRESSO', totalAtletas: 1 }));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await result.current.gerarLote(['a1']);
        });

        // timeout adaptativo p/ 1 atleta = 5 min; avança além disso.
        await act(async () => { await vi.advanceTimersByTimeAsync(5 * 60_000 + 1000); });

        expect(result.current.error).toMatch(/demorando mais que o esperado/);
        expect(result.current.loading).toBe(false);

        const chamadasAteAqui = vi.mocked(BatchPlanService.consultarStatus).mock.calls.length;
        await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
        expect(vi.mocked(BatchPlanService.consultarStatus).mock.calls.length).toBe(chamadasAteAqui);
    });

    it('seta error quando o polling (consultarStatus) falha após o disparo', async () => {
        vi.mocked(BatchPlanService.gerarEmLote).mockResolvedValue({ jobId: 'job-1', totalAtletas: 1 });
        vi.mocked(BatchPlanService.consultarStatus).mockRejectedValue(new Error('rede'));

        const { result } = renderHook(() => useBatchPlanGeneration());
        await act(async () => {
            await result.current.gerarLote(['a1']);
        });
        await flush();

        expect(result.current.error).toBe('Falha ao consultar o progresso da geração.');
        expect(result.current.loading).toBe(false);
    });
});
