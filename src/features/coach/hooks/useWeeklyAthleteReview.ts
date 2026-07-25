import { useCallback, useEffect, useState } from 'react';
import { CoachRevisaoSemanalService } from '../../../api/services/CoachRevisaoSemanalService';
import { ApiError } from '../../../api/core/ApiError';
import type { RevisaoSemanalOutputDto } from '../../../types/RevisaoSemanal';

/**
 * Busca a última revisão semanal do atleta. Espelha `useAthleteProfile`, mas distingue o 404
 * (nenhuma semana fechada → `naoDisponivel`, estado empty) de um erro real.
 */
export const useWeeklyAthleteReview = (atletaId: string | undefined) => {
    const [revisao, setRevisao] = useState<RevisaoSemanalOutputDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [naoDisponivel, setNaoDisponivel] = useState(false);

    const fetchRevisao = useCallback(async () => {
        if (!atletaId) return;
        try {
            setIsLoading(true);
            setError(null);
            setNaoDisponivel(false);
            const data = await CoachRevisaoSemanalService.getRevisaoSemanal(atletaId);
            setRevisao(data);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setRevisao(null);
                setNaoDisponivel(true);
            } else {
                setError(err instanceof Error ? err : new Error('Erro ao buscar a revisão semanal'));
                setRevisao(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [atletaId]);

    useEffect(() => {
        fetchRevisao();
    }, [fetchRevisao]);

    return { revisao, isLoading, error, naoDisponivel, fetchRevisao };
};
