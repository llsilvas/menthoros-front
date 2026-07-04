import { useCallback, useState } from 'react';
import { KudosService } from '../api/services/KudosService';
import type { KudosInput, KudosOutput } from '../types/Kudos';

/** Envia um kudo (reconhecimento) do coach autenticado para um atleta (`POST /coach/atletas/{atletaId}/kudos`). */
export const useEnviarKudos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const enviar = useCallback(async (atletaId: string, input: KudosInput): Promise<KudosOutput> => {
        setLoading(true);
        setError(null);
        try {
            return await KudosService.registrarKudo(atletaId, input);
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao enviar kudo');
            setError(erro);
            throw erro;
        } finally {
            setLoading(false);
        }
    }, []);

    return { enviar, loading, error };
};
