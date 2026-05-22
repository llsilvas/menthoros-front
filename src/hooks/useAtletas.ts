import { useCallback, useState } from 'react';
import { AtletasService } from '../api/services/AtletasService';
import type { Atleta, AtletaFilters } from '../types/Atleta';

export const useAtletas = () => {
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAtletas = useCallback(async (filters?: AtletaFilters) => {
        try {
            setLoading(true);
            const data = await AtletasService.listarAtletas(
                filters?.nome || undefined,
                filters?.nivelExperiencia || undefined,
                filters?.temLesao,
            );
            setAtletas(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar atletas'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { atletas, loading, error, fetchAtletas };
};
