import { useCallback, useState } from 'react';
import { AthleteWorkoutTodayService } from '../../../api/services/AthleteWorkoutTodayService';
import type { MotivoPulo, TreinoHoje } from '../../../types/AthleteWorkoutToday';

/** Modo treino: o planejado de hoje (`GET /me/treinos/hoje`) e a ação de pular. */
export function useTodayWorkout() {
    const [treino, setTreino] = useState<TreinoHoje | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [pulando, setPulando] = useState(false);
    const [pularError, setPularError] = useState<Error | null>(null);

    const fetchTreino = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Sem treino hoje é 204 → undefined; estado vazio, não erro.
            setTreino((await AthleteWorkoutTodayService.getTreinoHoje()) ?? null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar o treino de hoje'));
        } finally {
            setLoading(false);
        }
    }, []);

    const pular = useCallback(async (motivo?: MotivoPulo) => {
        try {
            setPulando(true);
            setPularError(null);
            const atualizado = await AthleteWorkoutTodayService.pularHoje(motivo);
            setTreino(atualizado);
            return atualizado;
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao pular o treino de hoje');
            setPularError(erro);
            throw erro;
        } finally {
            setPulando(false);
        }
    }, []);

    return { treino, loading, error, fetchTreino, pular, pulando, pularError };
}
