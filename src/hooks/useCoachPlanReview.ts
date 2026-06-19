import { useCallback, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import type { PlanoSemanalDto } from '../types/PlanoReview';

export const useCoachPlanReview = () => {
    const [pendentes, setPendentes] = useState<PlanoSemanalDto[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [fetchError, setFetchError] = useState<Error | null>(null);
    const [actionError, setActionError] = useState<Error | null>(null);

    const fetchPendentes = useCallback(async () => {
        try {
            setIsFetching(true);
            setFetchError(null);
            const data = await CoachPlanoReviewService.listarPendentes();
            setPendentes(data);
        } catch (err) {
            setFetchError(err instanceof Error ? err : new Error('Erro ao buscar planos pendentes'));
        } finally {
            setIsFetching(false);
        }
    }, []);

    const aprovar = useCallback(async (id: string) => {
        try {
            setIsActing(true);
            setActionError(null);
            await CoachPlanoReviewService.aprovar(id);
            setPendentes(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error('Erro ao aprovar plano'));
        } finally {
            setIsActing(false);
        }
    }, []);

    const rejeitar = useCallback(async (id: string, motivo: string) => {
        try {
            setIsActing(true);
            setActionError(null);
            await CoachPlanoReviewService.rejeitar(id, motivo);
            setPendentes(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error('Erro ao rejeitar plano'));
        } finally {
            setIsActing(false);
        }
    }, []);

    return { pendentes, isFetching, isActing, fetchError, actionError, fetchPendentes, aprovar, rejeitar };
};
