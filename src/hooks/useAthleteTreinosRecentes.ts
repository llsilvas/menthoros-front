import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteTreinoRecente } from '../types/AthleteProgress';

/** Treinos recentes do atleta autenticado (`GET /api/v1/atletas/me/treinos`) — usado para volume. */
export const useAthleteTreinosRecentes = () => {
    const [treinos, setTreinos] = useState<AthleteTreinoRecente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTreinosRecentes = useCallback(async (dias?: number) => {
        try {
            setLoading(true);
            setError(null);
            setTreinos(await AthleteProgressService.getTreinosRecentes(dias));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar treinos recentes do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { treinos, loading, error, fetchTreinosRecentes };
};
