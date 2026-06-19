import { useCallback, useEffect, useState } from 'react';
import { CoachPlanoReviewService } from '../api/services/CoachPlanoReviewService';

/** Retorna o número de planos AGUARDANDO_REVISAO para o badge de nav. */
export const useCoachPlanPendingCount = () => {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const data = await CoachPlanoReviewService.listarPendentes();
            setCount(data.length);
        } catch {
            // badge é não-crítico — falha silenciosa
        }
    }, []);

    useEffect(() => { fetchCount(); }, [fetchCount]);

    return count;
};
