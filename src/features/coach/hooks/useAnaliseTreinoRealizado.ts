import { useCallback, useEffect, useState } from 'react';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';

/**
 * - `pronta`: análise `COMPLETED`.
 * - `indisponivel`: 204 ou `PENDING` com RPE — a análise ainda não existe.
 * - `semRpe`: o treino não tem RPE; a análise depende dele, então nem busca.
 * - `erro`: `FAILED` ou falha na busca — a tela segue sem banner (CA7).
 * - `ociosa`: sem treino para buscar.
 */
export type StatusAnalise = 'ociosa' | 'loading' | 'pronta' | 'indisponivel' | 'semRpe' | 'erro';

export interface AnaliseTreinoRealizadoState {
    status: StatusAnalise;
    data: AnaliseWorkout | null;
    refetch: () => void;
}

/**
 * Análise da IA de um treino realizado. Um único dono da requisição: o card de Planos chama este hook
 * e repassa o estado inteiro ao dialog, que só chama o hook quando não recebe o estado (D4).
 */
export function useAnaliseTreinoRealizado(
    treinoRealizadoId: string | undefined,
    temRpe: boolean,
): AnaliseTreinoRealizadoState {
    const [status, setStatus] = useState<StatusAnalise>('ociosa');
    const [data, setData] = useState<AnaliseWorkout | null>(null);
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        setData(null);
        if (!treinoRealizadoId) {
            setStatus('ociosa');
            return;
        }
        if (!temRpe) {
            setStatus('semRpe');
            return;
        }
        let ativo = true;
        setStatus('loading');
        const promise = AnaliseService.getAnaliseTreino(treinoRealizadoId);
        promise
            .then((analise) => {
                if (!ativo) return;
                // 204 chega como corpo vazio.
                if (!analise || analise.status === 'PENDING') {
                    setStatus('indisponivel');
                } else if (analise.status === 'COMPLETED') {
                    setData(analise);
                    setStatus('pronta');
                } else {
                    setStatus('erro');
                }
            })
            .catch(() => { if (ativo) setStatus('erro'); });
        return () => {
            ativo = false;
            promise.cancel?.();
        };
    }, [treinoRealizadoId, temRpe, tentativa]);

    const refetch = useCallback(() => setTentativa((n) => n + 1), []);

    return { status, data, refetch };
}
