import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../types/PlanoReview';

export const useEditTreinoPlanejado = () => {
    const [isSaving, setIsSaving] = useState(false);

    const editarTreino = useCallback(
        async (planoId: string, treinoId: string, patch: TreinoPlanejadoPatch): Promise<TreinoPlanejadoDto> => {
            setIsSaving(true);
            try {
                return await CoachPlanoReviewService.editarTreino(planoId, treinoId, patch);
            } catch (err) {
                throw err instanceof Error ? err : new Error('Erro ao editar treino');
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    return { isSaving, editarTreino };
};
