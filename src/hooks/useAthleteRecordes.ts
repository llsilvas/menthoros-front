import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteRecord } from '../types/AthleteProgress';

/** Recordes pessoais do atleta autenticado (`GET /api/v1/atletas/me/recordes`). */
export const useAthleteRecordes = () => {
    const [recordes, setRecordes] = useState<AthleteRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRecordes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setRecordes(await AthleteProgressService.getRecordes());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar recordes do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { recordes, loading, error, fetchRecordes };
};
