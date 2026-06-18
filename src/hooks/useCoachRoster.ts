import { useCallback, useState } from 'react';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachAtletaResumo } from '../types/Coach';

/** Roster do coach (`GET /api/v1/coach/atletas`). */
export const useCoachRoster = () => {
    const [roster, setRoster] = useState<CoachAtletaResumo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchRoster = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await CoachDashboardService.getRoster();
            setRoster(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar roster do coach'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { roster, loading, error, fetchRoster };
};
