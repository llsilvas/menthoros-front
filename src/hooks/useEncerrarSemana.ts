import { useCallback, useState } from 'react';
import { CoachSemanaService } from '../api/services/CoachSemanaService';
import type { EncerramentoLoteResult, EncerramentoSemanaResult } from '../types/Encerramento';

/**
 * Hook para o encerramento da semana pelo treinador: ação individual, preview do lote e lote real.
 * Expõe estado de loading/erro compartilhado (padrão de `useFitUpload`).
 */
export const useEncerrarSemana = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
        setLoading(true);
        setError(null);
        try {
            return await fn();
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao encerrar a semana');
            setError(erro);
            throw erro;
        } finally {
            setLoading(false);
        }
    }, []);

    const encerrarSemana = useCallback(
        (planoId: string): Promise<EncerramentoSemanaResult> =>
            run(() => CoachSemanaService.encerrarSemana(planoId)),
        [run],
    );

    const previewLote = useCallback(
        (): Promise<EncerramentoLoteResult> => run(() => CoachSemanaService.previewEncerrarLote()),
        [run],
    );

    const encerrarLote = useCallback(
        (): Promise<EncerramentoLoteResult> => run(() => CoachSemanaService.encerrarLote()),
        [run],
    );

    return { encerrarSemana, previewLote, encerrarLote, loading, error };
};
