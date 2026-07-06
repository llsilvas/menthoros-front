import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEncerrarSemana } from './useEncerrarSemana';
import { CoachSemanaService } from '../api/services/CoachSemanaService';
import type { EncerramentoLoteResult, EncerramentoSemanaResult } from '../types/Encerramento';

vi.mock('../api/services/CoachSemanaService');

const SEMANA: EncerramentoSemanaResult = {
    planoId: 'p1',
    novoStatus: 'CONCLUIDO',
    treinosFinalizados: 2,
    treinosPerdidos: ['t1', 't2'],
    prontoParaProximaSemana: true,
    origem: 'ON_DEMAND',
    aviso: null,
};

const LOTE: EncerramentoLoteResult = {
    atletasProcessados: 3,
    atletasSemPlano: 1,
    planosConcluidos: 3,
    treinosPerdidosTotal: 5,
    resultados: [SEMANA],
    falhas: [],
};

describe('useEncerrarSemana', () => {
    beforeEach(() => vi.clearAllMocks());

    it('encerrarSemana retorna o resumo e gerencia loading/erro', async () => {
        vi.mocked(CoachSemanaService.encerrarSemana).mockResolvedValue(SEMANA);

        const { result } = renderHook(() => useEncerrarSemana());
        let r!: EncerramentoSemanaResult;
        await act(async () => { r = await result.current.encerrarSemana('p1'); });

        expect(r.treinosFinalizados).toBe(2);
        expect(CoachSemanaService.encerrarSemana).toHaveBeenCalledWith('p1');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('previewLote retorna a projeção consolidada', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(LOTE);

        const { result } = renderHook(() => useEncerrarSemana());
        let r!: EncerramentoLoteResult;
        await act(async () => { r = await result.current.previewLote(); });

        expect(r.atletasProcessados).toBe(3);
        expect(r.resultados).toHaveLength(1);
    });

    it('popula error e propaga quando a ação falha', async () => {
        vi.mocked(CoachSemanaService.encerrarSemana).mockRejectedValue(new Error('409'));

        const { result } = renderHook(() => useEncerrarSemana());
        await act(async () => {
            await expect(result.current.encerrarSemana('p1')).rejects.toThrow('409');
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.loading).toBe(false);
    });
});
