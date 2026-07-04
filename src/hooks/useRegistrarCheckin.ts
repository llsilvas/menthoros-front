import { useCallback, useState } from 'react';
import { CheckinService } from '../api/services/CheckinService';
import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../types/Checkin';

/** Registra o check-in diário de prontidão do atleta autenticado (`POST /api/v1/checkins`). */
export const useRegistrarCheckin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const registrar = useCallback(async (input: CheckinProntidaoInput): Promise<CheckinProntidaoOutput> => {
        setLoading(true);
        setError(null);
        try {
            return await CheckinService.registrarCheckin(input);
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao registrar check-in');
            setError(erro);
            throw erro;
        } finally {
            setLoading(false);
        }
    }, []);

    return { registrar, loading, error };
};
