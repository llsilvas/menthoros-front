import { useCallback, useState } from 'react';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachInsights } from '../types/Coach';

/** Insights agregados do coach (`GET /api/v1/coach/insights`). `from`/`to` = intervalo opcional. */
export const useCoachInsights = () => {
    const [insights, setInsights] = useState<CoachInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchInsights = useCallback(async (from?: string, to?: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await CoachDashboardService.getInsights(from, to);
            setInsights(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar insights do coach'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { insights, loading, error, fetchInsights };
};
