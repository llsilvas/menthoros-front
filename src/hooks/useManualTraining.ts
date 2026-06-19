import { useCallback, useState } from 'react';
import { ManualTrainingService } from '../api/services/ManualTrainingService';
import type { TreinoManualInput, TreinoRealizadoDto } from '../types/TreinoManual';

export const useManualTraining = (dias = 7) => {
    const [recentes, setRecentes] = useState<TreinoRealizadoDto[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<Error | null>(null);

    const fetchRecentes = useCallback(async () => {
        try {
            setIsFetching(true);
            setFetchError(null);
            const data = await ManualTrainingService.listarRecentes(dias);
            setRecentes(data);
        } catch (err) {
            setFetchError(err instanceof Error ? err : new Error('Erro ao buscar treinos recentes'));
        } finally {
            setIsFetching(false);
        }
    }, [dias]);

    const registrar = useCallback(async (input: TreinoManualInput): Promise<TreinoRealizadoDto> => {
        setIsSubmitting(true);
        try {
            const salvo = await ManualTrainingService.registrar(input);
            await fetchRecentes();
            return salvo;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Erro ao registrar treino');
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchRecentes]);

    return { recentes, isFetching, isSubmitting, fetchError, registrar, fetchRecentes };
};
