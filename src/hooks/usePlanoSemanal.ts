import { useCallback, useRef, useState } from 'react';
import { PlanoSemanalService } from '../api/services/PlanoSemanalService';
import { PlanoSemanasService } from '../services/PlanoSemanasService';
import type { PlanoSemanal } from '../types/PlanoSemanal';

export const usePlanoSemanal = () => {
    const [planos, setPlanos] = useState<PlanoSemanal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // Só a requisição mais recente grava estado: um reload lento do atleta anterior (ou de antes de
    // um salvamento) não sobrescreve a lista nova (editar-treino-aprovado-planos-dialog, D5).
    const ultimaRequisicao = useRef(0);

    /** Resultado do reload: `obsoleta` não é falha — uma requisição mais nova grava a lista. */
    type ResultadoFetch = 'ok' | 'falha' | 'obsoleta';

    /**
     * Carrega, numa chamada, os planos em andamento do atleta e as 4 últimas semanas concluídas
     * (o limite é do backend). Antes usava `GET /planos/{atletaId}`, que devolve um único plano e
     * nunca um concluído — por isso o histórico não aparecia.
     */
    const fetchPlanosPorAtleta = useCallback(async (atletaId: string): Promise<ResultadoFetch> => {
        if (!atletaId) {
            console.error('atletaId é obrigatório');
            setError(new Error('ID do atleta é obrigatório'));
            return 'falha';
        }

        const requisicao = ++ultimaRequisicao.current;
        const vigente = () => requisicao === ultimaRequisicao.current;
        try {
            setLoading(true);
            setError(null);
            const response = await PlanoSemanasService.listarSemanasDoAtleta(atletaId);
            if (!vigente()) return 'obsoleta';
            setPlanos(Array.isArray(response) ? response : []);
            return 'ok';
        } catch (err) {
            if (!vigente()) return 'obsoleta';
            console.error('Erro no fetchPlanosPorAtleta:', err);
            setError(err instanceof Error ? err : new Error('Erro ao buscar planos semanais'));
            setPlanos([]);
            return 'falha';
        } finally {
            if (vigente()) setLoading(false);
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
        // Fechar o dialog invalida o reload em voo: ele não repovoa a lista do atleta anterior.
        ultimaRequisicao.current++;
        setPlanos([]);
        setLoading(false);
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