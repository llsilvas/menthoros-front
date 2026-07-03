import { useCallback, useState } from 'react';
import { AthleteHomeService } from '../api/services/AthleteHomeService';
import type { AthleteHome } from '../types/AthleteHome';

/** Resumo "hoje" do atleta autenticado (`GET /api/v1/atletas/me/home`). */
export const useAthleteHome = () => {
    const [home, setHome] = useState<AthleteHome | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchHome = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setHome(await AthleteHomeService.getHome());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar resumo do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { home, loading, error, fetchHome };
};
