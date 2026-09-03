import { useCallback, useEffect, useState } from 'react';
import { ProvaService } from '../../../api/services/ProvaService';
import type { Prova } from '../../../types/Prova';

/**
 * Provas de um atleta para o card do perfil do coach: a listagem normal mais as pendentes de
 * ciência (inclui canceladas), lidas direto do backend — o card não depende do corte da fila de
 * atenção (design D6/D8). `marcarCiente` registra a ciência e recarrega.
 */
export const useCoachAthleteRaces = (atletaId: string | undefined) => {
    const [provas, setProvas] = useState<Prova[]>([]);
    const [pendentes, setPendentes] = useState<Prova[]>([]);
    const [loading, setLoading] = useState(false);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchRaces = useCallback(async () => {
        if (!atletaId) return;
        try {
            setLoading(true);
            setError(null);
            const [lista, pendentesLista] = await Promise.all([
                ProvaService.listarProvas(atletaId),
                ProvaService.listarPendentesRevisao(atletaId),
            ]);
            // Resposta fora do contrato (não-lista) não pode derrubar a página inteira do perfil.
            setProvas(Array.isArray(lista) ? lista : []);
            setPendentes(Array.isArray(pendentesLista) ? pendentesLista : []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar provas do atleta'));
        } finally {
            setLoading(false);
        }
    }, [atletaId]);

    const marcarCiente = useCallback(async (provaId: string) => {
        if (!atletaId) return;
        try {
            setActing(true);
            setError(null);
            await ProvaService.marcarCiente(atletaId, provaId);
            await fetchRaces();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao registrar ciência'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [atletaId, fetchRaces]);

    useEffect(() => {
        fetchRaces();
    }, [fetchRaces]);

    return { provas, pendentes, loading, acting, error, fetchRaces, marcarCiente };
};
