import { useCallback, useEffect, useRef, useState } from 'react';
import { BatchPlanService } from '../api/services/BatchPlanService';
import type { BatchLoteAceito, BatchPlanJobStatus, ModoGeracaoPlano } from '../types/BatchPlanJob';
import { isBatchJobTerminal } from '../types/BatchPlanJob';

const POLL_INTERVALO_MS = 3000;
const TIMEOUT_MSG = 'A geração está demorando mais que o esperado — verifique novamente em instantes.';

/**
 * Timeout de segurança adaptativo ao tamanho do lote: ~3 min por "onda" de 4 atletas
 * (pior caso ~160s/atleta com concorrência 4), mínimo 5 min. Um teto fixo abortaria
 * lotes grandes saudáveis. A fonte de verdade de "travado" é o backend (recovery).
 */
const calcularTimeoutMs = (totalAtletas: number): number =>
    Math.max(5, Math.ceil(totalAtletas / 4) * 3) * 60_000;

/**
 * Dispara a geração de planos em lote e acompanha o progresso por polling.
 * O contador de `gerados`/`erros` sobe continuamente conforme o backend processa cada atleta.
 */
export const useBatchPlanGeneration = () => {
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<BatchPlanJobStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pararPolling = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const consultar = useCallback(
        async (id: string) => {
            try {
                const atual = await BatchPlanService.consultarStatus(id);
                setStatus(atual);
                if (isBatchJobTerminal(atual.status)) {
                    pararPolling();
                    setLoading(false);
                }
            } catch {
                pararPolling();
                setError('Falha ao consultar o progresso da geração.');
                setLoading(false);
            }
        },
        [pararPolling],
    );

    const gerarLote = useCallback(
        async (atletaIds: string[], modo: ModoGeracaoPlano = 'PROXIMA_SEMANA'): Promise<BatchLoteAceito> => {
            pararPolling();
            setError(null);
            setStatus(null);
            setLoading(true);
            try {
                const aceito = await BatchPlanService.gerarEmLote(atletaIds, modo);
                setJobId(aceito.jobId);
                void consultar(aceito.jobId); // primeira leitura imediata
                intervalRef.current = setInterval(() => void consultar(aceito.jobId), POLL_INTERVALO_MS);
                timeoutRef.current = setTimeout(() => {
                    pararPolling();
                    setError(TIMEOUT_MSG);
                    setLoading(false);
                }, calcularTimeoutMs(aceito.totalAtletas));
                return aceito;
            } catch (err) {
                setLoading(false);
                setError(err instanceof Error ? err.message : 'Falha ao iniciar a geração em lote.');
                throw err;
            }
        },
        [consultar, pararPolling],
    );

    const reset = useCallback(() => {
        pararPolling();
        setJobId(null);
        setStatus(null);
        setError(null);
        setLoading(false);
    }, [pararPolling]);

    // Limpa timers ao desmontar.
    useEffect(() => pararPolling, [pararPolling]);

    return { jobId, status, loading, error, gerarLote, reset };
};
