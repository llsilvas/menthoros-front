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
                return await CoachPlanoReviewService.editarTreino(planoId, treinoId, patch);
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
