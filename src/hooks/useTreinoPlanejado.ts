import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoAddPayload, TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../types/PlanoReview';

export function useTreinoPlanejado() {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveError, setSaveError] = useState<Error | null>(null);
    const [deleteError, setDeleteError] = useState<Error | null>(null);

    const adicionarTreino = useCallback(
        async (planoId: string, payload: TreinoPlanejadoAddPayload): Promise<TreinoPlanejadoDto> => {
            setIsSaving(true);
            setSaveError(null);
            try {
                return await CoachPlanoReviewService.adicionarTreino(planoId, payload);
            } catch (err) {
                const e = err instanceof Error ? err : new Error('Erro ao adicionar treino');
                setSaveError(e);
                throw e;
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    const editarTreino = useCallback(
        async (planoId: string, treinoId: string, patch: TreinoPlanejadoPatch): Promise<TreinoPlanejadoDto> => {
            setIsSaving(true);
            setSaveError(null);
            try {
                const salvo = await CoachPlanoReviewService.editarTreino(planoId, treinoId, patch);
                // Backend sem suporte a `dataTreino` ignora o campo e devolve 200 com a data antiga:
                // sem esta checagem o treinador veria sucesso e o treino continuaria no dia de origem.
                if (patch.dataTreino && salvo.dataTreino !== patch.dataTreino) {
                    throw new Error('Não foi possível mover o treino: a nova data não foi aplicada.');
                }
                return salvo;
            } catch (err) {
                const e = err instanceof Error ? err : new Error('Erro ao editar treino');
                setSaveError(e);
                throw e;
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    const excluirTreino = useCallback(async (planoId: string, treinoId: string): Promise<void> => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await CoachPlanoReviewService.excluirTreino(planoId, treinoId);
        } catch (err) {
            const e = err instanceof Error ? err : new Error('Erro ao excluir treino');
            setDeleteError(e);
            throw e;
        } finally {
            setIsDeleting(false);
        }
    }, []);

    return {
        isSaving,
        isDeleting,
        saveError,
        deleteError,
        adicionarTreino,
        editarTreino,
        excluirTreino,
    };
}
