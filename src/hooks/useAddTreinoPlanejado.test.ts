import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTreinoPlanejado } from './useTreinoPlanejado';
import * as service from '../api/services/CoachPlanoReviewService';
import type { CancelablePromise } from '../api';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload, TreinoPlanejadoPatch } from '../types/PlanoReview';

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

const PATCH: TreinoPlanejadoPatch = {
    distanciaKm: 12,
};

describe('useTreinoPlanejado', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sucesso ao adicionar: retorna o treino criado e limpa saveError', async () => {
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockResolvedValue(RESULTADO);

        const { result } = renderHook(() => useTreinoPlanejado());

        let treino: TreinoPlanejadoDto | undefined;
        await act(async () => {
            treino = await result.current.adicionarTreino(PLANO_ID, PAYLOAD);
        });

        expect(treino).toEqual(RESULTADO);
        expect(result.current.saveError).toBeNull();
        expect(result.current.isSaving).toBe(false);
    });

    it('erro ao adicionar: lança exceção e armazena em saveError', async () => {
        const err = new Error('Plano não está em revisão');
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockRejectedValue(err);

        const { result } = renderHook(() => useTreinoPlanejado());

        let thrown: Error | undefined;
        await act(async () => {
            try {
                await result.current.adicionarTreino(PLANO_ID, PAYLOAD);
            } catch (e) {
                thrown = e as Error;
            }
        });

        expect(thrown).toBeInstanceOf(Error);
        expect(result.current.saveError).toBeInstanceOf(Error);
        expect(result.current.isSaving).toBe(false);
    });

    it('sucesso ao editar: retorna o treino atualizado', async () => {
        const editado = { ...RESULTADO, editadoPeloCoach: true };
        vi.mocked(service.CoachPlanoReviewService.editarTreino).mockResolvedValue(editado);

        const { result } = renderHook(() => useTreinoPlanejado());

        let treino: TreinoPlanejadoDto | undefined;
        await act(async () => {
            treino = await result.current.editarTreino(PLANO_ID, 'treino-1', PATCH);
        });

        expect(treino).toEqual(editado);
        expect(result.current.saveError).toBeNull();
        expect(result.current.isSaving).toBe(false);
    });

    it('erro ao editar: lança exceção e armazena em saveError', async () => {
        const err = new Error('Plano não encontrado');
        vi.mocked(service.CoachPlanoReviewService.editarTreino).mockRejectedValue(err);

        const { result } = renderHook(() => useTreinoPlanejado());

        let thrown: Error | undefined;
        await act(async () => {
            try {
                await result.current.editarTreino(PLANO_ID, 'treino-1', PATCH);
            } catch (e) {
                thrown = e as Error;
            }
        });

        expect(thrown?.message).toBe('Plano não encontrado');
        expect(result.current.saveError).not.toBeNull();
    });

    it('sucesso ao excluir: não deixa erro e finaliza isDeleting', async () => {
        vi.mocked(service.CoachPlanoReviewService.excluirTreino).mockResolvedValue(undefined);

        const { result } = renderHook(() => useTreinoPlanejado());

        await act(async () => {
            await result.current.excluirTreino(PLANO_ID, 'treino-1');
        });

        expect(result.current.deleteError).toBeNull();
        expect(result.current.isDeleting).toBe(false);
    });

    it('loading state: isSaving=true durante adição', async () => {
        let resolveFn!: (v: TreinoPlanejadoDto) => void;
        const pendingPromise = new Promise<TreinoPlanejadoDto>((res) => { resolveFn = res; });
        vi.mocked(service.CoachPlanoReviewService.adicionarTreino).mockReturnValue(
            pendingPromise as unknown as CancelablePromise<TreinoPlanejadoDto>,
        );

        const { result } = renderHook(() => useTreinoPlanejado());

        expect(result.current.isSaving).toBe(false);

        act(() => {
            result.current.adicionarTreino(PLANO_ID, PAYLOAD).catch(() => {});
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => { resolveFn(RESULTADO); });

        expect(result.current.isSaving).toBe(false);
    });
});
