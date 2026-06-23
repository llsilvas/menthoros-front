import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddTreinoPlanejado } from './useAddTreinoPlanejado';
import * as service from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload } from '../types/PlanoReview';

vi.mock('../api/services/CoachPlanoReviewService');

const PLANO_ID = 'plano-1';
const PAYLOAD: TreinoPlanejadoAddPayload = {
    tipoTreino: 'CONTINUO',
    dataTreino: '2026-07-03',
};
const RESULTADO: TreinoPlanejadoDto = {
    id: 'treino-novo',
    diaSemana: 'SEXTA',
    tipoTreino: 'CONTINUO',
    distanciaKm: 0,
    adicionadoPeloCoach: true,
};

describe('useAddTreinoPlanejado', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sucesso: retorna o treino criado e limpa erro', async () => {
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockResolvedValue(RESULTADO as never);

        const { result } = renderHook(() => useAddTreinoPlanejado());

        let treino: TreinoPlanejadoDto | undefined;
        await act(async () => {
            treino = await result.current.adicionarTreino(PLANO_ID, PAYLOAD);
        });

        expect(treino).toEqual(RESULTADO);
        expect(result.current.error).toBeNull();
        expect(result.current.isSaving).toBe(false);
    });

    it('erro 422: lança exceção e armazena em error', async () => {
        const err = new Error('Plano não está em revisão');
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockRejectedValue(err as never);

        const { result } = renderHook(() => useAddTreinoPlanejado());

        let thrown: Error | undefined;
        await act(async () => {
            try {
                await result.current.adicionarTreino(PLANO_ID, PAYLOAD);
            } catch (e) {
                thrown = e as Error;
            }
        });

        expect(thrown).toBeInstanceOf(Error);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.isSaving).toBe(false);
    });

    it('erro 404: lança exceção e armazena em error', async () => {
        const err = new Error('Plano não encontrado');
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockRejectedValue(err as never);

        const { result } = renderHook(() => useAddTreinoPlanejado());

        let thrown: Error | undefined;
        await act(async () => {
            try {
                await result.current.adicionarTreino(PLANO_ID, PAYLOAD);
            } catch (e) {
                thrown = e as Error;
            }
        });

        expect(thrown?.message).toBe('Plano não encontrado');
        expect(result.current.error).not.toBeNull();
    });

    it('loading state: isSaving=true durante a chamada', async () => {
        let resolveFn!: (v: TreinoPlanejadoDto) => void;
        const pendingPromise = new Promise<TreinoPlanejadoDto>((res) => { resolveFn = res; });
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockReturnValue(pendingPromise as never);

        const { result } = renderHook(() => useAddTreinoPlanejado());

        expect(result.current.isSaving).toBe(false);

        act(() => {
            result.current.adicionarTreino(PLANO_ID, PAYLOAD).catch(() => {});
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => { resolveFn(RESULTADO); });

        expect(result.current.isSaving).toBe(false);
    });
});
