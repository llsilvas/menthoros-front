import { useCallback, useState } from 'react';
import { CoachDashboardService } from '../api/services/CoachDashboardService';
import type { CoachAttentionItem } from '../types/Coach';

/** Fila de atenção do coach (`GET /api/v1/coach/attention-queue`). */
export const useAttentionQueue = () => {
    const [queue, setQueue] = useState<CoachAttentionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchQueue = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await CoachDashboardService.getAttentionQueue();
            setQueue(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar fila de atenção'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { queue, loading, error, fetchQueue };
};
