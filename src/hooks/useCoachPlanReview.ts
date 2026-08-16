import { useCallback, useMemo, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';
import { resolveReviewStatus } from '../types/PlanoReview';
import type { PlanoReviewStatus, PlanoSemanalDto } from '../types/PlanoReview';

export type ReviewFilter = PlanoReviewStatus | 'all';

/**
 * Resultado de uma ação de revisão.
 *
 * Devolver `boolean` descartava o motivo da falha antes de chegar à tela: o componente sabia que
 * "não deu", mas não se o plano já tinha sido processado por outra sessão (409/422) ou se faltava
 * permissão (403) — dois casos com saídas opostas para o coach.
 */
export interface ReviewActionResult {
    ok: boolean;
    /** Status HTTP quando a falha veio do servidor; ausente em erro de rede. */
    status?: number;
}

function statusDoErro(err: unknown): number | undefined {
    return typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;
}

export const useCoachPlanReview = () => {
    const [allPlanos, setAllPlanos] = useState<PlanoSemanalDto[]>([]);
    const [activeFilter, setActiveFilter] = useState<ReviewFilter>('AGUARDANDO_REVISAO');
    const [isFetching, setIsFetching] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [fetchError, setFetchError] = useState<Error | null>(null);
    const [actionError, setActionError] = useState<Error | null>(null);
    const [actionStatus, setActionStatus] = useState<number | null>(null);

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

    const aprovar = useCallback(async (id: string): Promise<ReviewActionResult> => {
        try {
            setIsActing(true);
            setActionError(null);
            setActionStatus(null);
            await CoachPlanoReviewService.aprovar(id);
            await fetchPendentes();
            return { ok: true };
        } catch (err) {
            const status = statusDoErro(err);
            setActionError(err instanceof Error ? err : new Error('Erro ao aprovar plano'));
            setActionStatus(status ?? null);
            return { ok: false, status };
        } finally {
            setIsActing(false);
        }
    }, [fetchPendentes]);

    const rejeitar = useCallback(async (id: string, motivo: string): Promise<ReviewActionResult> => {
        try {
            setIsActing(true);
            setActionError(null);
            setActionStatus(null);
            await CoachPlanoReviewService.rejeitar(id, motivo);
            await fetchPendentes();
            return { ok: true };
        } catch (err) {
            const status = statusDoErro(err);
            setActionError(err instanceof Error ? err : new Error('Erro ao rejeitar plano'));
            setActionStatus(status ?? null);
            return { ok: false, status };
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
        actionStatus,
        fetchPendentes,
        aprovar,
        rejeitar,
    };
};
