import { useCallback, useState } from 'react';
import { ProvaService } from '../api/services/ProvaService';
import type { Prova, CreateProva, UpdateProva } from '../types/Prova';

export const useProvas = () => {
    const [provas, setProvas] = useState<Prova[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProvas = useCallback(async (atletaId: string): Promise<void> => {
        if (!atletaId) {
            setError('ID do atleta é obrigatório');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await ProvaService.listarProvas(atletaId);
            setProvas(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar provas');
            setProvas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const createProva = useCallback(async (atletaId: string, data: CreateProva): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await ProvaService.criarProva(atletaId, data);
            await fetchProvas(atletaId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar prova');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchProvas]);

    const updateProva = useCallback(async (atletaId: string, provaId: string, data: UpdateProva): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await ProvaService.atualizarProva(atletaId, provaId, data);
            await fetchProvas(atletaId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar prova');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchProvas]);

    const deleteProva = useCallback(async (atletaId: string, provaId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await ProvaService.deletarProva(atletaId, provaId);
            setProvas(prev => prev.filter(p => p.id !== provaId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir prova');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearProvas = useCallback(() => {
        setProvas([]);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        provas,
        loading,
        error,
        fetchProvas,
        createProva,
        updateProva,
        deleteProva,
        clearProvas,
        clearError,
    };
};
