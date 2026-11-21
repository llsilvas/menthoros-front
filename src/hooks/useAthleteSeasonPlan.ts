import { useCallback, useState } from 'react';
import { SeasonPlanService } from '../api/services/SeasonPlanService';
import type { AthleteSeasonPlan } from '../types/SeasonPlan';

/**
 * Temporada aprovada do atleta autenticado (`GET /api/v1/atletas/me/season-plan`). `season === null` sem
 * erro = nenhuma aprovada visível (204, inclusive com a flag desligada).
 */
export const useAthleteSeasonPlan = () => {
    const [season, setSeason] = useState<AthleteSeasonPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSeason = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setSeason((await SeasonPlanService.buscarMinha()) ?? null);
        } catch (err) {
            setSeason(null);
            setError(err instanceof Error ? err : new Error('Erro ao buscar a temporada'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { season, loading, error, fetchSeason };
};
