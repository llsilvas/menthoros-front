import { useCallback, useState } from 'react';
import { AthleteProgressService } from '../api/services/AthleteProgressService';
import type { AthleteZones } from '../types/AthleteProgress';

/** Distribuição de zonas do atleta autenticado (`GET /api/v1/atletas/me/metricas/zonas`). */
export const useAthleteZones = () => {
    const [zones, setZones] = useState<AthleteZones | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchZones = useCallback(async (from?: string, to?: string) => {
        try {
            setLoading(true);
            setError(null);
            setZones(await AthleteProgressService.getZonas(from, to));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar distribuição de zonas do atleta'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { zones, loading, error, fetchZones };
};
