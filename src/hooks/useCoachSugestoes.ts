import { useCallback, useState } from 'react';
import { SugestaoService } from '../api/services/SugestaoService';
import type { SugestaoCoachOutputDto, SugestaoStatus } from '../types/SugestaoCoach';

export const useCoachSugestoes = (status: SugestaoStatus = 'PENDING') => {
    const [sugestoes, setSugestoes] = useState<SugestaoCoachOutputDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSugestoes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await SugestaoService.listar(status);
            setSugestoes(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar sugestões'));
        } finally {
            setLoading(false);
        }
    }, [status]);

    return { sugestoes, loading, error, fetchSugestoes };
};
