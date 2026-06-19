import { useCallback, useState } from 'react';
import { SugestaoService } from '../api/services/SugestaoService';
import type { SugestaoCoachOutputDto } from '../types/SugestaoCoach';

/** Sugestões pendentes do coach (`GET /api/v1/coach/sugestoes?status=PENDING`). */
export const useCoachSugestoes = () => {
    const [sugestoes, setSugestoes] = useState<SugestaoCoachOutputDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSugestoes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await SugestaoService.listar('PENDING');
            setSugestoes(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar sugestões'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { sugestoes, loading, error, fetchSugestoes };
};
