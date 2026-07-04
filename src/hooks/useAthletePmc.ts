import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthletePmc } from '../types/AthleteProgress';

/** Histórico PMC do atleta autenticado (`GET /api/v1/atletas/me/metricas/historico`). */
export const useAthletePmc = () => {
    const [pmc, setPmc] = useState<AthletePmc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchPmc = useCallback(async (from?: string, to?: string) => {
        try {
            setLoading(true);
            setError(null);
            setPmc(await AthleteProgressService.getPmcHistorico(from, to));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar histórico PMC do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { pmc, loading, error, fetchPmc };
};
