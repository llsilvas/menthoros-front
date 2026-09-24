import { useCallback, useState } from 'react';
import { PlanoSemanalService } from '../api/services/PlanoSemanalService';
import type { PlanoSemanal } from '../types/PlanoSemanal';

export const usePlanoSemanal = () => {
    const [planos, setPlanos] = useState<PlanoSemanal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchPlanosPorAtleta = useCallback(async (atletaId: string) => {
        console.log('usePlanoSemanal - fetchPlanosPorAtleta iniciado para:', atletaId);

        if (!atletaId) {
            console.error('atletaId é obrigatório');
            setError(new Error('ID do atleta é obrigatório'));
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('Chamando PlanoSemanalService.listarPlanosPorAtleta...');

            const response = await PlanoSemanalService.listarPlanosPorAtleta(atletaId);
            console.log('Response completa:', response);
            console.log('Tipo da response:', typeof response);
            console.log('É array?', Array.isArray(response));

            if (Array.isArray(response)) {
                console.log('Definindo planos com array:', response);
                setPlanos(response);
            } else if (response && typeof response === 'object') {
                console.log('Response é um objeto único, convertendo para array:', response);
                setPlanos([response]);
            } else {
                console.error('Response em formato inesperado:', response);
                setPlanos([]);
            }
        } catch (err) {
            console.error('Erro no fetchPlanosPorAtleta:', err);
            setError(err instanceof Error ? err : new Error('Erro ao buscar planos semanais'));
            setPlanos([]);
        } finally {
            setLoading(false);
            console.log('fetchPlanosPorAtleta finalizado');
        }
    }, []);

    const deletePlano = useCallback(async (id: string) => {
        try {
            setLoading(true);
            await PlanoSemanalService.deletarPlanoSemanal(id);
            setPlanos(prev => prev.filter(plano => plano.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao deletar plano semanal'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // gerarPlanoSemanal (síncrono) removido: a geração passou a ser assíncrona via
    // useBatchPlanGeneration (lote de 1 + polling) — o síncrono estourava o timeout de 60s do
    // nginx em atleta cold-start (change gerar-plano-individual-assincrono). O endpoint do backend
    // permanece; só o front deixou de usá-lo aqui.

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearPlanos = useCallback(() => {
        setPlanos([]);
    }, []);

    return {
        planos,
        loading,
        error,
        fetchPlanosPorAtleta,
        deletePlano,
        clearError,
        clearPlanos
    };
};