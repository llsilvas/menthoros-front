import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { TreinoPlanejadoAddPayload, TreinoPlanejadoDto } from '../types/PlanoReview';

export function useAddTreinoPlanejado() {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const adicionarTreino = useCallback(
        async (planoId: string, payload: TreinoPlanejadoAddPayload): Promise<TreinoPlanejadoDto> => {
            setIsSaving(true);
            setError(null);
            try {
                return await CoachPlanoReviewService.adicionarTreino(planoId, payload);
            } catch (err) {
                const e = err instanceof Error ? err : new Error('Erro ao adicionar treino');
                setError(e);
                throw e;
            } finally {
                setIsSaving(false);
            }
        },
        [],
    );

    return { isSaving, error, adicionarTreino };
}
