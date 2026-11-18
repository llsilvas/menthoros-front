import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan } from '../../../types/SeasonPlan';

const isDisabled = (err: unknown) =>
    err instanceof ApiError && err.status === 404 && err.body?.code === 'SEASON_PLAN_DISABLED';

const toError = (err: unknown, fallback: string) =>
    err instanceof ApiError && typeof err.body?.message === 'string'
        ? new Error(err.body.message)
        : err instanceof Error ? err : new Error(fallback);

/**
 * Temporada aberta do atleta para a aba Temporada do inbox. `plan === null` sem erro = atleta sem
 * temporada (204). `disabled` = flag `season-plan.enabled` desligada no backend: a aba some.
 */
export const useSeasonPlan = (atletaId: string | undefined) => {
    const [plan, setPlan] = useState<SeasonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchPlan = useCallback(async () => {
        setPlan(null);
        if (!atletaId) return;
        try {
            setLoading(true);
            setError(null);
            setPlan((await SeasonPlanService.buscarAtual(atletaId)) ?? null);
            setDisabled(false);
        } catch (err) {
            if (isDisabled(err)) setDisabled(true);
            else setError(toError(err, 'Erro ao buscar a temporada'));
        } finally {
            setLoading(false);
        }
    }, [atletaId]);

    const generate = useCallback(async () => {
        if (!atletaId) return;
        try {
            setGenerating(true);
            setError(null);
            setPlan(await SeasonPlanService.gerar(atletaId));
        } catch (err) {
            if (isDisabled(err)) setDisabled(true);
            else setError(toError(err, 'Erro ao gerar a temporada'));
        } finally {
            setGenerating(false);
        }
    }, [atletaId]);

    useEffect(() => {
        void fetchPlan();
    }, [fetchPlan]);

    return { plan, loading, generating, disabled, error, fetchPlan, generate };
};
