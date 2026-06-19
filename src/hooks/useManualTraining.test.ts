import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManualTraining } from './useManualTraining';
import { ManualTrainingService } from '../api/services/ManualTrainingService';
import type { TreinoManualInput, TreinoRealizadoDto } from '../types/TreinoManual';

vi.mock('../api/services/ManualTrainingService');

const STUB_DTO: TreinoRealizadoDto = {
    id: 'uuid-1',
    dataTreino: '2026-06-19',
    tipoTreino: 'CONTINUO',
    duracaoMin: '00:45:00',
    distanciaKm: 8.5,
    percepcaoEsforco: 6,
    tssCalculado: 42,
    fonteDados: { value: 'MANUAL', label: 'Manual' },
    status: { value: 'REALIZADO', label: 'Realizado' },
};

const INPUT: TreinoManualInput = {
    tipo: 'CONTINUO',
    data: '2026-06-19',
    duracaoMinutos: 45,
    distanciaKm: 8.5,
    percepcaoEsforco: 6,
};

describe('useManualTraining', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('fetchRecentes', () => {
        it('popula recentes com treinos do período', async () => {
            vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([STUB_DTO]);

            const { result } = renderHook(() => useManualTraining());
            await act(async () => { await result.current.fetchRecentes(); });

            expect(result.current.recentes).toHaveLength(1);
            expect(result.current.recentes[0].tipoTreino).toBe('CONTINUO');
            expect(result.current.error).toBeNull();
            expect(result.current.isFetching).toBe(false);
        });

        it('retorna lista vazia quando não há treinos no período', async () => {
            vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([]);

            const { result } = renderHook(() => useManualTraining());
            await act(async () => { await result.current.fetchRecentes(); });

            expect(result.current.recentes).toEqual([]);
            expect(result.current.error).toBeNull();
        });

        it('popula error quando listagem falha', async () => {
            vi.mocked(ManualTrainingService.listarRecentes).mockRejectedValue(new Error('timeout'));

            const { result } = renderHook(() => useManualTraining());
            await act(async () => { await result.current.fetchRecentes(); });

            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.recentes).toEqual([]);
            expect(result.current.isFetching).toBe(false);
        });
    });

    describe('registrar', () => {
        it('chama registrar, atualiza recentes e retorna treino salvo', async () => {
            vi.mocked(ManualTrainingService.registrar).mockResolvedValue(STUB_DTO);
            vi.mocked(ManualTrainingService.listarRecentes).mockResolvedValue([STUB_DTO]);

            const { result } = renderHook(() => useManualTraining());
            let salvo!: TreinoRealizadoDto;
            await act(async () => { salvo = await result.current.registrar(INPUT); });

            expect(salvo.id).toBe('uuid-1');
            expect(ManualTrainingService.registrar).toHaveBeenCalledWith(INPUT);
            expect(ManualTrainingService.listarRecentes).toHaveBeenCalled();
            expect(result.current.recentes).toHaveLength(1);
            expect(result.current.isSubmitting).toBe(false);
        });

        it('propaga error e seta state quando POST falha', async () => {
            vi.mocked(ManualTrainingService.registrar).mockRejectedValue(new Error('422'));

            const { result } = renderHook(() => useManualTraining());
            await act(async () => {
                await expect(result.current.registrar(INPUT)).rejects.toThrow('422');
            });

            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.isSubmitting).toBe(false);
        });

        it('não atualiza recentes quando POST falha', async () => {
            vi.mocked(ManualTrainingService.registrar).mockRejectedValue(new Error('boom'));

            const { result } = renderHook(() => useManualTraining());
            await act(async () => {
                try { await result.current.registrar(INPUT); } catch { /* esperado */ }
            });

            expect(ManualTrainingService.listarRecentes).not.toHaveBeenCalled();
        });
    });
});
