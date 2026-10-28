import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/core/ApiError';
import { CoachAthleteZonesService } from '../api/services/CoachAthleteZonesService';
import type { AthleteTrainingZonesDto } from '../types/AthleteTrainingZones';

/**
 * Zonas de pace e FC do atleta, para o treinador (`GET /api/v1/coach/atletas/{atletaId}/zonas`).
 * Busca ao montar e a cada troca de `atletaId`. 404 (atleta fora do tenant) vira `zones = null`
 * sem erro: não há o que mostrar, e não é falha de carregamento.
 */
export const useAthleteTrainingZones = (atletaId: string | undefined) => {
    const [zones, setZones] = useState<AthleteTrainingZonesDto | null>(null);
    const [loading, setLoading] = useState(Boolean(atletaId));
    const [error, setError] = useState<Error | null>(null);

    const fetchZones = useCallback(async () => {
        if (!atletaId) return;
        try {
            setLoading(true);
            setError(null);
            setZones(await CoachAthleteZonesService.getZonas(atletaId));
        } catch (err) {
            setZones(null);
            if (err instanceof ApiError && err.status === 404) return;
            setError(err instanceof Error ? err : new Error('Erro ao buscar zonas do atleta'));
        } finally {
            setLoading(false);
        }
    }, [atletaId]);

    useEffect(() => {
        setZones(null);
        void fetchZones();
    }, [fetchZones]);

    return { zones, loading, error, fetchZones };
};
