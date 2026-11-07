import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTreinoPlanejado } from './useTreinoPlanejado';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';

vi.mock('../api/services/CoachPlanoReviewService');

describe('useTreinoPlanejado.editarTreino — mover de dia (coach-alterar-data-treino, 2.5)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resposta com a data enviada: devolve o treino salvo', async () => {
        vi.mocked(CoachPlanoReviewService.editarTreino).mockResolvedValue(
            { id: 't1', diaSemana: 'QUARTA', tipoTreino: 'FACIL', distanciaKm: 10, dataTreino: '2026-09-09' } as never,
        );
        const { result } = renderHook(() => useTreinoPlanejado());

        const salvo = await act(() => result.current.editarTreino('p1', 't1', { dataTreino: '2026-09-09' }));

        expect(salvo.dataTreino).toBe('2026-09-09');
        expect(result.current.saveError).toBeNull();
    });

    it('backend antigo devolve 200 com a data de origem: erro, não sucesso silencioso', async () => {
        vi.mocked(CoachPlanoReviewService.editarTreino).mockResolvedValue(
            { id: 't1', diaSemana: 'SEGUNDA', tipoTreino: 'FACIL', distanciaKm: 10, dataTreino: '2026-09-07' } as never,
        );
        const { result } = renderHook(() => useTreinoPlanejado());

        await expect(act(() => result.current.editarTreino('p1', 't1', { dataTreino: '2026-09-09' })))
            .rejects.toThrow(/não foi possível mover o treino/i);
    });

    it('patch sem data não compara a resposta', async () => {
        vi.mocked(CoachPlanoReviewService.editarTreino).mockResolvedValue({ id: 't1' } as never);
        const { result } = renderHook(() => useTreinoPlanejado());

        await expect(act(() => result.current.editarTreino('p1', 't1', { tssPlanejado: 60 }))).resolves.toEqual({ id: 't1' });
    });
});
