import { useCallback, useEffect, useRef, useState } from 'react';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan, SeasonWeekUpdate } from '../../../types/SeasonPlan';
import { seasonPlanError } from '../adapters/seasonPlanError';

/**
 * Ajuste da temporada (add-season-plan-adjust-v2): lê o rascunho, salva uma semana por vez, aprova
 * com motivo e descarta. As ações devolvem `true`/a temporada em caso de sucesso para a página decidir
 * se navega; o erro fica exposto para o treinador.
 */
export const useSeasonAdjustment = (atletaId: string | undefined, seasonPlanId: string | undefined) => {
    const [plan, setPlan] = useState<SeasonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [savingWeek, setSavingWeek] = useState<number | null>(null);
    const [saveError, setSaveError] = useState<Error | null>(null);
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState<Error | null>(null);
    const [discarding, setDiscarding] = useState(false);
    const [discardError, setDiscardError] = useState<Error | null>(null);
    // Resposta de uma leitura superada (troca de rota) é descartada.
    const requestRef = useRef(0);

    const load = useCallback(async () => {
        const request = ++requestRef.current;
        setLoadError(null);
        if (!atletaId || !seasonPlanId) {
            setPlan(null);
            return;
        }
        setLoading(true);
        try {
            const result = await SeasonPlanService.buscarPorId(atletaId, seasonPlanId);
            if (request === requestRef.current) setPlan(result);
        } catch (err) {
            if (request === requestRef.current) setLoadError(seasonPlanError(err, 'Erro ao carregar o ajuste da temporada'));
        } finally {
            if (request === requestRef.current) setLoading(false);
        }
    }, [atletaId, seasonPlanId]);

    const saveWeek = useCallback(async (weekIndex: number, update: SeasonWeekUpdate): Promise<boolean> => {
        if (!atletaId || !seasonPlanId) return false;
        setSavingWeek(weekIndex);
        setSaveError(null);
        try {
            setPlan(await SeasonPlanService.atualizarSemana(atletaId, seasonPlanId, weekIndex, update));
            return true;
        } catch (err) {
            setSaveError(seasonPlanError(err, 'Erro ao salvar a semana'));
            return false;
        } finally {
            setSavingWeek(null);
        }
    }, [atletaId, seasonPlanId]);

    const approve = useCallback(async (reason: string): Promise<SeasonPlan | null> => {
        if (!atletaId || !seasonPlanId) return null;
        setApproving(true);
        setApproveError(null);
        try {
            const approved = await SeasonPlanService.aprovar(atletaId, seasonPlanId, reason.trim());
            setPlan(approved);
            return approved;
        } catch (err) {
            setApproveError(seasonPlanError(err, 'Erro ao aprovar a nova versão'));
            return null;
        } finally {
            setApproving(false);
        }
    }, [atletaId, seasonPlanId]);

    const discard = useCallback(async (): Promise<boolean> => {
        if (!atletaId || !seasonPlanId) return false;
        setDiscarding(true);
        setDiscardError(null);
        try {
            await SeasonPlanService.descartar(atletaId, seasonPlanId);
            return true;
        } catch (err) {
            setDiscardError(seasonPlanError(err, 'Erro ao descartar o ajuste'));
            return false;
        } finally {
            setDiscarding(false);
        }
    }, [atletaId, seasonPlanId]);

    useEffect(() => {
        void load();
    }, [load]);

    return {
        plan, loading, loadError, savingWeek, saveError, approving, approveError, discarding, discardError,
        reload: load, saveWeek, approve, discard,
    };
};
