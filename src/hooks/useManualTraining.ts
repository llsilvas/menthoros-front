import { useCallback, useState } from 'react';
import { ManualTrainingService } from '../api/services/ManualTrainingService';
import type { TreinoManualInput, TreinoRealizadoDto } from '../types/TreinoManual';

export const useManualTraining = (dias = 7) => {
    const [recentes, setRecentes] = useState<TreinoRealizadoDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchRecentes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ManualTrainingService.listarRecentes(dias);
            setRecentes(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar treinos recentes'));
        } finally {
            setLoading(false);
        }
    }, [dias]);

    const registrar = useCallback(async (input: TreinoManualInput): Promise<TreinoRealizadoDto> => {
        setLoading(true);
        setError(null);
        try {
            const salvo = await ManualTrainingService.registrar(input);
            await fetchRecentes();
            return salvo;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro ao registrar treino');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchRecentes]);

    return { recentes, loading, error, registrar, fetchRecentes };
};
