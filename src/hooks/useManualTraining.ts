import { useCallback, useState } from 'react';
import { ManualTrainingService } from '../api/services/ManualTrainingService';
import type { TreinoManualInput, TreinoRealizadoDto } from '../types/TreinoManual';

export const useManualTraining = (dias = 7) => {
    const [recentes, setRecentes] = useState<TreinoRealizadoDto[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchRecentes = useCallback(async () => {
        try {
            setIsFetching(true);
            setError(null);
            const data = await ManualTrainingService.listarRecentes(dias);
            setRecentes(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar treinos recentes'));
        } finally {
            setIsFetching(false);
        }
    }, [dias]);

    const registrar = useCallback(async (input: TreinoManualInput): Promise<TreinoRealizadoDto> => {
        setIsSubmitting(true);
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
            setIsSubmitting(false);
        }
    }, [fetchRecentes]);

    return { recentes, isFetching, isSubmitting, error, registrar, fetchRecentes };
};
