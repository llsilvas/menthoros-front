import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEditTreinoPlanejado } from './useEditTreinoPlanejado';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../types/PlanoReview';

vi.mock('../api/services/CoachPlanoReviewService');

const PLANO_ID = 'plano-1';
const TREINO_ID = 'treino-1';

const PATCH: TreinoPlanejadoPatch = { distanciaKm: 12 };

const TREINO_ATUALIZADO: TreinoPlanejadoDto = {
    id: TREINO_ID,
    diaSemana: 'SEGUNDA',
    tipoTreino: 'FACIL',
    distanciaKm: 12,
    editadoPeloCoach: true,
};

describe('useEditTreinoPlanejado', () => {
    beforeEach(() => vi.clearAllMocks());

    it('inicia com isSaving=false', () => {
        const { result } = renderHook(() => useEditTreinoPlanejado());
        expect(result.current.isSaving).toBe(false);
    });

    it('seta isSaving=true durante a chamada e false ao terminar', async () => {
        let resolvePromise!: (v: TreinoPlanejadoDto) => void;
        const pendingPromise = new Promise<TreinoPlanejadoDto>((r) => { resolvePromise = r; });
        vi.mocked(CoachPlanoReviewService.editarTreino).mockReturnValue(
            pendingPromise as unknown as ReturnType<typeof CoachPlanoReviewService.editarTreino>,
        );

        const { result } = renderHook(() => useEditTreinoPlanejado());

        let editPromise: Promise<TreinoPlanejadoDto>;
        act(() => {
            editPromise = result.current.editarTreino(PLANO_ID, TREINO_ID, PATCH);
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => {
            resolvePromise(TREINO_ATUALIZADO);
            await editPromise;
        });

        expect(result.current.isSaving).toBe(false);
    });

    it('retorna TreinoPlanejadoDto atualizado em sucesso', async () => {
        vi.mocked(CoachPlanoReviewService.editarTreino).mockResolvedValue(TREINO_ATUALIZADO);

        const { result } = renderHook(() => useEditTreinoPlanejado());
        let treino!: TreinoPlanejadoDto;

        await act(async () => {
            treino = await result.current.editarTreino(PLANO_ID, TREINO_ID, PATCH);
        });

        expect(treino).toEqual(TREINO_ATUALIZADO);
    });

    it('lança erro ao consumidor em falha de API', async () => {
        const apiError = new Error('422 Plano não está em revisão');
        vi.mocked(CoachPlanoReviewService.editarTreino).mockRejectedValue(apiError);

        const { result } = renderHook(() => useEditTreinoPlanejado());

        await act(async () => {
            await expect(result.current.editarTreino(PLANO_ID, TREINO_ID, PATCH)).rejects.toThrow(apiError);
        });

        expect(result.current.isSaving).toBe(false);
    });

    it('encapsula erros não-Error em Error padrão', async () => {
        vi.mocked(CoachPlanoReviewService.editarTreino).mockRejectedValue('string error');

        const { result } = renderHook(() => useEditTreinoPlanejado());

        await act(async () => {
            await expect(result.current.editarTreino(PLANO_ID, TREINO_ID, PATCH))
                .rejects.toThrow('Erro ao editar treino');
        });
    });
});
