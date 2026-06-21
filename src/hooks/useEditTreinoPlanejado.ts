import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../types/PlanoReview';

export const useEditTreinoPlanejado = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<Error | null>(null);

    const editarTreino = useCallback(
        async (planoId: string, treinoId: string, patch: TreinoPlanejadoPatch): Promise<TreinoPlanejadoDto> => {
            setIsSaving(true);
            setSaveError(null);
            try {
                return await CoachPlanoReviewService.editarTreino(planoId, treinoId, patch);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Erro ao editar treino');
                setSaveError(error);
                throw error;
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    return { isSaving, saveError, editarTreino };
};
