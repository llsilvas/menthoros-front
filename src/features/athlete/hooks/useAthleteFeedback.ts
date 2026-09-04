import { useCallback, useState } from 'react';
import { AthleteFeedbackService } from '../../../api/services/AthleteFeedbackService';
import type { FeedbackTreinoInput } from '../../../types/AthleteFeedback';

/** "Como foi?" pós-treino: um envio, sem estado próprio do formulário (isso é do componente). */
export function useAthleteFeedback() {
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const enviar = useCallback(async (treinoRealizadoId: string, input: FeedbackTreinoInput) => {
        try {
            setEnviando(true);
            setError(null);
            return await AthleteFeedbackService.registrarFeedback(treinoRealizadoId, input);
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao enviar feedback');
            setError(erro);
            throw erro;
        } finally {
            setEnviando(false);
        }
    }, []);

    return { enviar, enviando, error };
}
