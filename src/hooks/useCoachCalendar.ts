import { useCallback, useState } from 'react';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachCalendario } from '../types/Coach';

/** Calendário semanal do coach (`GET /api/v1/coach/calendario-semanal`). `from` = dia da semana desejada. */
export const useCoachCalendar = () => {
    const [calendario, setCalendario] = useState<CoachCalendario | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchCalendario = useCallback(async (from?: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await CoachDashboardService.getCalendario(from);
            setCalendario(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar calendário do coach'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { calendario, loading, error, fetchCalendario };
};
