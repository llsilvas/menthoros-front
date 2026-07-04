import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteAderencia } from '../types/AthleteProgress';

/** Aderência semanal ao plano do atleta autenticado (`GET /api/v1/atletas/me/aderencia`). */
export const useAthleteAderencia = () => {
    const [aderencia, setAderencia] = useState<AthleteAderencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAderencia = useCallback(async (semanas?: number) => {
        try {
            setLoading(true);
            setError(null);
            setAderencia(await AthleteProgressService.getAderencia(semanas));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar aderência do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { aderencia, loading, error, fetchAderencia };
};
