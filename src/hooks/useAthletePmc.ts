import { useCallback, useEffect, useRef, useState } from 'react';
import { AtletaProgressService } from '../api/services/AtletaProgressService';
import { mapPmcHistoricoToDataPoints } from '../features/athlete/adapters/pmcAdapter';
import type { PMCDataPoint } from '../features/athlete/components/PMCChart';

export interface UseAthletePmcResult {
    data: PMCDataPoint[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Série PMC coach-scoped de um atleta (`GET /api/v1/atletas/{id}/metricas/historico`).
 *
 * Mais leve que o perfil agregado: busca só o histórico PMC. Pensado para fetch *lazy* —
 * é montado pelo painel de visão rápida apenas quando o atleta é expandido, nunca em massa.
 * Ignora respostas obsoletas quando `atletaId` muda durante uma busca em andamento.
 */
export const useAthletePmc = (
    atletaId: string | undefined,
    from?: string,
    to?: string,
): UseAthletePmcResult => {
    const [data, setData] = useState<PMCDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const requestIdRef = useRef(0);

    const fetchPmc = useCallback(async () => {
        if (!atletaId) return;
        const requestId = ++requestIdRef.current;
        try {
            setIsLoading(true);
            setError(null);
            const pontos = await AtletaProgressService.getHistoricoPmc(atletaId, from, to);
            if (requestId !== requestIdRef.current) return; // resposta obsoleta — atleta já mudou
            setData(mapPmcHistoricoToDataPoints(pontos));
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(err instanceof Error ? err : new Error('Erro ao buscar histórico PMC do atleta'));
            setData([]);
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false);
        }
    }, [atletaId, from, to]);

    useEffect(() => {
        fetchPmc();
    }, [fetchPmc]);

    return { data, isLoading, error, refetch: fetchPmc };
};
