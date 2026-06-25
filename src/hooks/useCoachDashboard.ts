import { useCallback, useState } from 'react';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachDashboard, CoachDashboardQuery } from '../types/Coach';

/** Dashboard agregado do coach (`GET /api/v1/coach/dashboard`). */
export const useCoachDashboard = () => {
    const [dashboard, setDashboard] = useState<CoachDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchDashboard = useCallback(async (query?: CoachDashboardQuery) => {
        try {
            setLoading(true);
            setError(null);
            const data = await CoachDashboardService.getDashboard(query);
            setDashboard(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar dashboard do coach'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { dashboard, loading, error, fetchDashboard };
};
