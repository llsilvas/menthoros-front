import { useEffect, useState } from 'react';
import { OnboardingService } from '../../../api/services/OnboardingService';
import type { CalibrationStatus } from '../../../types/Calibracao';

/**
 * Status de calibração do atleta selecionado, para travar "Gerar temporada" na aba Temporada.
 * `status === null` = fora de calibração (204), sem atleta ou consulta falhou. Com `error`, a ação fica
 * habilitada de propósito: o backend é a fonte de verdade e responde 422 se o atleta estiver calibrando.
 */
export const useAthleteCalibration = (atletaId: string | undefined) => {
    const [status, setStatus] = useState<CalibrationStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setStatus(null);
        setError(null);
        if (!atletaId) {
            setLoading(false);
            return;
        }
        let atual = true;
        setLoading(true);
        OnboardingService.obterStatusCalibracao(atletaId)
            .then((s) => { if (atual) setStatus(s ?? null); })
            .catch((err: unknown) => {
                if (atual) setError(err instanceof Error ? err : new Error('Erro ao consultar a calibração'));
            })
            .finally(() => { if (atual) setLoading(false); });
        return () => { atual = false; };
    }, [atletaId]);

    return { status, loading, error };
};
