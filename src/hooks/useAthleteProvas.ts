import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { Prova } from '../types/Prova';

/** Provas cadastradas do atleta autenticado (`GET /api/v1/atletas/me/provas`). */
export const useAthleteProvas = () => {
    const [provas, setProvas] = useState<Prova[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProvas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setProvas(await AthleteProgressService.getProvas());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar provas do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { provas, loading, error, fetchProvas };
};
