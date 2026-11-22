import { useEffect, useState } from 'react';
import { OnboardingService } from '../../../api/services/OnboardingService';
import type { CalibrationStatus } from '../../../types/Calibracao';

/**
 * Status de calibração do atleta selecionado, para travar "Gerar temporada" na aba Temporada.
 * `null` = fora de calibração (204), sem atleta ou consulta falhou: na dúvida a ação fica habilitada,
 * porque o backend é a fonte de verdade e responde 422 se o atleta estiver calibrando.
 */
export const useAthleteCalibration = (atletaId: string | undefined): CalibrationStatus | null => {
    const [status, setStatus] = useState<CalibrationStatus | null>(null);

    useEffect(() => {
        setStatus(null);
        if (!atletaId) return;
        let atual = true;
        OnboardingService.obterStatusCalibracao(atletaId)
            .then((s) => { if (atual) setStatus(s ?? null); })
            .catch(() => { if (atual) setStatus(null); });
        return () => { atual = false; };
    }, [atletaId]);

    return status;
};
