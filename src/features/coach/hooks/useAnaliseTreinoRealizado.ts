import { useCallback, useEffect, useState } from 'react';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';

// Mesma janela do card do atleta (useAthleteWorkoutAnalysis). A análise roda assíncrona depois do RPE,
// e o 204 do endpoint do coach não distingue "gerando" de "nunca será gerada": daí o limite.
export const INTERVALO_MS = 15_000;
export const MAX_CONSULTAS = 12;

/**
 * - `pronta`: análise `COMPLETED`.
 * - `processando`: 204 ou `PENDING` com RPE — a análise ainda não existe e o hook segue consultando.
 * - `indisponivel`: esgotadas as consultas sem análise.
 * - `semRpe`: o treino não tem RPE; a análise depende dele, então nem busca.
 * - `erro`: `FAILED` ou falha na busca — a tela segue sem banner (CA7).
 * - `ociosa`: sem treino para buscar.
 */
export type StatusAnalise = 'ociosa' | 'loading' | 'pronta' | 'processando' | 'indisponivel' | 'semRpe' | 'erro';

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
        let consultas = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let promise: ReturnType<typeof AnaliseService.getAnaliseTreino> | undefined;

        const consultar = () => {
            consultas += 1;
            promise = AnaliseService.getAnaliseTreino(treinoRealizadoId);
            promise
                .then((analise) => {
                    if (!ativo) return;
                    // 204 chega como corpo vazio.
                    if (!analise || analise.status === 'PENDING') {
                        if (consultas < MAX_CONSULTAS) {
                            setStatus('processando');
                            timer = setTimeout(consultar, INTERVALO_MS);
                        } else {
                            setStatus('indisponivel');
                        }
                    } else if (analise.status === 'COMPLETED') {
                        setData(analise);
                        setStatus('pronta');
                    } else {
                        setStatus('erro');
                    }
                })
                .catch(() => { if (ativo) setStatus('erro'); });
        };

        setStatus('loading');
        consultar();
        return () => {
            ativo = false;
            clearTimeout(timer);
            promise?.cancel?.();
        };
    }, [treinoRealizadoId, temRpe, tentativa]);

    const refetch = useCallback(() => setTentativa((n) => n + 1), []);

    return { status, data, refetch };
}
