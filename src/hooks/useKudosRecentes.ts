import { useCallback, useState } from 'react';
import { KudosService } from '../api/services/KudosService';
import type { KudosRecente } from '../types/Kudos';

/** Kudos recentes recebidos pelo atleta autenticado (`GET /api/v1/atletas/me/kudos/recentes`). */
export const useKudosRecentes = () => {
    const [kudos, setKudos] = useState<KudosRecente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchKudos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setKudos(await KudosService.buscarRecentes());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar kudos'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { kudos, loading, error, fetchKudos };
};
