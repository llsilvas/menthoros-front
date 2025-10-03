import { useCallback, useState } from 'react';
import { AtletasService } from '../api/services/AtletasService';
import type { Atleta } from '../types/Atleta';

export const useAtletas = () => {
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAtletas = useCallback(async () => {
        try {
            setLoading(true);
            const data = await AtletasService.listarAtletas();
            setAtletas(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar atletas'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { atletas, loading, error, fetchAtletas };
};
