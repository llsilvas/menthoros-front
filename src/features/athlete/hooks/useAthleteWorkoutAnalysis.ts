import { useEffect, useState } from 'react';
import { AthleteAnalysisService } from '../../../api/services/AthleteAnalysisService';
import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';

export type UseAthleteWorkoutAnalysisStatus =
    | 'idle'      // sem treinoRealizadoId — nada a buscar
    | 'loading'   // primeira consulta em andamento
    | 'pending'   // 200 PENDING — análise processando
    | 'done'      // 200 COMPLETED
    | 'empty'     // 204 — sem card (não elegível, falhou, bloqueado ou desligado)
    | 'error';

/** 15 s entre consultas em `pending`, por até 3 min (design D5) — a análise leva ~30–60 s. */
const INTERVALO_MS = 15_000;
const MAX_CONSULTAS = 12;

/**
 * Análise pós-treino do atleta para um realizado. Em `pending`, reconsulta a cada 15 s por até
 * 3 min enquanto o componente está montado; para ao concluir, esvaziar ou desmontar. Sem
 * WebSocket de propósito — passado o limite, o card permanece "Analisando…" e o atleta reabre
 * o treino mais tarde.
 */
export function useAthleteWorkoutAnalysis(treinoRealizadoId: string | null) {
    const [analysis, setAnalysis] = useState<AthleteWorkoutAnalysis | null>(null);
    const [status, setStatus] = useState<UseAthleteWorkoutAnalysisStatus>('idle');
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!treinoRealizadoId) {
            setAnalysis(null);
            setStatus('idle');
            setError(null);
            return;
        }

        let cancelado = false;
        let consultas = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const consultar = async (primeira: boolean) => {
            if (primeira) {
                setStatus('loading');
                setError(null);
            }
            try {
                const dto = await AthleteAnalysisService.getByRealizado(treinoRealizadoId);
                if (cancelado) return;
                consultas += 1;
                if (!dto) {
                    setAnalysis(null);
                    setStatus('empty');
                    return;
                }
                setAnalysis(dto);
                if (dto.status === 'COMPLETED') {
                    setStatus('done');
                    return;
                }
                setStatus('pending');
                if (consultas < MAX_CONSULTAS) {
                    timer = setTimeout(() => consultar(false), INTERVALO_MS);
                }
            } catch (err) {
                if (cancelado) return;
                setError(err instanceof Error ? err : new Error('Erro ao buscar análise do treino'));
                setStatus('error');
            }
        };

        consultar(true);

        return () => {
            cancelado = true;
            if (timer) clearTimeout(timer);
        };
    }, [treinoRealizadoId]);

    return { analysis, status, error, loading: status === 'loading' };
}
