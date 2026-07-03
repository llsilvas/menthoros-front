import { useCallback, useState } from 'react';
import { AthleteHomeService } from '../api/services/AthleteHomeService';
import type { AthleteReadiness } from '../types/AthleteHome';

/** Readiness atual do atleta autenticado (`GET /api/v1/atletas/me/readiness`). */
export const useAthleteReadiness = () => {
    const [readiness, setReadiness] = useState<AthleteReadiness | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchReadiness = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setReadiness(await AthleteHomeService.getReadiness());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar readiness'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { readiness, loading, error, fetchReadiness };
};
