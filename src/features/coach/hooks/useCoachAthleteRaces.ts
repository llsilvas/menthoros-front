import { useCallback, useEffect, useRef, useState } from 'react';
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
    // Na inbox o atleta muda sem desmontar o painel: provas do anterior não podem aparecer sob o
    // novo, nem um "Ciente" sair com o id de prova de outro atleta.
    const [atletaExibido, setAtletaExibido] = useState(atletaId);
    if (atletaExibido !== atletaId) {
        setAtletaExibido(atletaId);
        setProvas([]);
        setPendentes([]);
        setError(null);
        setActing(false);
    }
    const atletaAtualRef = useRef(atletaId);
    useEffect(() => {
        atletaAtualRef.current = atletaId;
    }, [atletaId]);

    const fetchRaces = useCallback(async () => {
        if (!atletaId) return;
        const obsoleta = () => atletaAtualRef.current !== atletaId;
        try {
            setLoading(true);
            setError(null);
            const [lista, pendentesLista] = await Promise.all([
                ProvaService.listarProvas(atletaId),
                ProvaService.listarPendentesRevisao(atletaId),
            ]);
            if (obsoleta()) return;
            // Resposta fora do contrato (não-lista) não pode derrubar a página inteira do perfil.
            setProvas(Array.isArray(lista) ? lista : []);
            setPendentes(Array.isArray(pendentesLista) ? pendentesLista : []);
        } catch (err) {
            if (obsoleta()) return;
            setError(err instanceof Error ? err : new Error('Erro ao buscar provas do atleta'));
        } finally {
            if (!obsoleta()) setLoading(false);
        }
    }, [atletaId]);

    const marcarCiente = useCallback(async (provaId: string) => {
        if (!atletaId) return;
        const obsoleta = () => atletaAtualRef.current !== atletaId;
        try {
            setActing(true);
            setError(null);
            await ProvaService.marcarCiente(atletaId, provaId);
            await fetchRaces();
        } catch (err) {
            if (!obsoleta()) setError(err instanceof Error ? err : new Error('Erro ao registrar ciência'));
            throw err;
        } finally {
            if (!obsoleta()) setActing(false);
        }
    }, [atletaId, fetchRaces]);

    useEffect(() => {
        fetchRaces();
    }, [fetchRaces]);

    return { provas, pendentes, loading, acting, error, fetchRaces, marcarCiente };
};
