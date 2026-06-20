import { useCallback, useMemo, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import { resolveReviewStatus } from '../types/PlanoReview';
import type { PlanoReviewStatus, PlanoSemanalDto } from '../types/PlanoReview';

export type ReviewFilter = PlanoReviewStatus | 'all';

export const useCoachPlanReview = () => {
    const [allPlanos, setAllPlanos] = useState<PlanoSemanalDto[]>([]);
    const [activeFilter, setActiveFilter] = useState<ReviewFilter>('AGUARDANDO_REVISAO');
    const [isFetching, setIsFetching] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [fetchError, setFetchError] = useState<Error | null>(null);
    const [actionError, setActionError] = useState<Error | null>(null);

    // Vista filtrada — derivada sem re-fetch
    const pendentes = useMemo(() =>
        activeFilter === 'all'
            ? allPlanos
            : allPlanos.filter(p => resolveReviewStatus(p.reviewStatus) === activeFilter),
        [allPlanos, activeFilter]
    );

    const fetchPendentes = useCallback(async () => {
        try {
            setIsFetching(true);
            setFetchError(null);
            const [aguardando, aprovados, rejeitados] = await Promise.all([
                CoachPlanoReviewService.listarPorStatus('AGUARDANDO_REVISAO'),
                CoachPlanoReviewService.listarPorStatus('APROVADO'),
                CoachPlanoReviewService.listarPorStatus('REJEITADO'),
            ]);
            setAllPlanos([...aguardando, ...aprovados, ...rejeitados]);
        } catch (err) {
            setFetchError(err instanceof Error ? err : new Error('Erro ao buscar planos'));
        } finally {
            setIsFetching(false);
        }
    }, []);

    const aprovar = useCallback(async (id: string): Promise<boolean> => {
        try {
            setIsActing(true);
            setActionError(null);
            await CoachPlanoReviewService.aprovar(id);
            await fetchPendentes();
            return true;
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error('Erro ao aprovar plano'));
            return false;
        } finally {
            setIsActing(false);
        }
    }, [fetchPendentes]);

    const rejeitar = useCallback(async (id: string, motivo: string): Promise<boolean> => {
        try {
            setIsActing(true);
            setActionError(null);
            await CoachPlanoReviewService.rejeitar(id, motivo);
            await fetchPendentes();
            return true;
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error('Erro ao rejeitar plano'));
            return false;
        } finally {
            setIsActing(false);
        }
    }, [fetchPendentes]);

    return {
        allPlanos,
        pendentes,
        activeFilter,
        setFilter: setActiveFilter,
        isFetching,
        isActing,
        fetchError,
        actionError,
        fetchPendentes,
        aprovar,
        rejeitar,
    };
};
