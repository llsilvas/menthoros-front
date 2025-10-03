import { useCallback, useState } from 'react';
import { TreinoService } from '../api/services/TreinoService';
import type { TreinoRealizado, CreateTreinoRealizado, UpdateTreinoRealizado } from '../types/TreinoRealizado';


export const useTreinoRealizado = () => {
    const [treinosRealizados, setTreinosRealizados] = useState<TreinoRealizado[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTreinosRealizadosPorAtleta = useCallback(async (atletaId: string) => {
        console.log('useTreinoRealizado - fetchTreinosRealizadosPorAtleta iniciado para:', atletaId);

        if (!atletaId) {
            console.error('atletaId é obrigatório');
            setError(new Error('ID do atleta é obrigatório'));
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('Chamando TreinoRealizadoService.listarTreinosRealizadosPorAtleta...');

            const response = await TreinoService.listarTreinosRealizadosPorAtleta(atletaId);
            console.log('Response completa:', response);
            console.log('Tipo da response:', typeof response);
            console.log('É array?', Array.isArray(response));

            if( Array.isArray(response)) {
                console.log('Definindo treinosRealizados com array:', response);
                setTreinosRealizados(response);
            } else {
                console.error('Response inválido. Esperado array, recebido:', response);
                setError(new Error('Response inválido. Esperado array de treinos realizados'));
            }
        } catch (err) {
            console.error('Erro ao buscar treinos realizados:', err);
            setError(err instanceof Error ? err : new Error('Erro ao buscar treinos realizados'));
        } finally {
            setLoading(false);
        }
    }, []);

    const createTreinoRealizado = useCallback(async (dados: CreateTreinoRealizado) => {
        try {
            setLoading(true);
            const novoTreino = await TreinoService.criarTreinoRealizado(dados);
            setTreinosRealizados(prev => [...prev, novoTreino]);
            return novoTreino;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao criar treino realizado'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        treinosRealizados,
        loading,
        error,
        fetchTreinosRealizadosPorAtleta,
        createTreinoRealizado,
        clearError
    };
}