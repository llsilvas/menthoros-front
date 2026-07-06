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

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Identifica a geração corrente: respostas de uma geração antiga (após reset/novo
    // disparo) são descartadas, evitando sobrescrever o estado com dados obsoletos.
    const geracaoRef = useRef(0);

    const pararPolling = useCallback(() => {
        geracaoRef.current += 1;
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (safetyTimeoutRef.current !== null) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
        }
    }, []);

    // Busca o status agora e, se ainda não terminal, agenda a próxima consulta APÓS a
    // resposta (setTimeout encadeado — nunca há duas requisições em voo). O `geracao`
    // descarta respostas obsoletas (de uma geração anterior a um reset/novo disparo).
    const consultar = useCallback(async (id: string, geracao: number) => {
        try {
            const atual = await BatchPlanService.consultarStatus(id);
            if (geracao !== geracaoRef.current) return;
            setStatus(atual);
            if (isBatchJobTerminal(atual.status)) {
                pararPolling();
                setLoading(false);
                return;
            }
            timeoutRef.current = setTimeout(() => void consultar(id, geracao), POLL_INTERVALO_MS);
        } catch {
            if (geracao !== geracaoRef.current) return;
            pararPolling();
            setError('Falha ao consultar o progresso da geração.');
            setLoading(false);
        }
    }, [pararPolling]);

    const gerarLote = useCallback(
        async (atletaIds: string[], modo: ModoGeracaoPlano = 'PROXIMA_SEMANA'): Promise<BatchLoteAceito> => {
            pararPolling();
            setError(null);
            setStatus(null);
            setLoading(true);
            try {
                const aceito = await BatchPlanService.gerarEmLote(atletaIds, modo);
                const geracao = geracaoRef.current;
                setJobId(aceito.jobId);
                void consultar(aceito.jobId, geracao); // leitura imediata; auto-agenda as próximas
                safetyTimeoutRef.current = setTimeout(() => {
                    if (geracao !== geracaoRef.current) return;
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
