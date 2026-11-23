import { useCallback, useEffect, useRef, useState } from 'react';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan, SeasonWeekUpdate } from '../../../types/SeasonPlan';
import { seasonPlanError } from '../adapters/seasonPlanError';

/**
 * Ajuste da temporada (add-season-plan-adjust-v2): lê o rascunho, salva uma semana por vez, aprova
 * com motivo e descarta. As ações devolvem sucesso para a página decidir se navega; o erro fica exposto
 * para o treinador. Resposta de uma rota superada (outro rascunho) ou depois de desmontar é descartada.
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
    const chave = `${atletaId ?? ''}/${seasonPlanId ?? ''}`;
    // Rota atual (null depois de desmontar) e a última leitura pedida.
    const chaveRef = useRef<string | null>(chave);
    const requestRef = useRef(0);
    const vigente = (k: string) => chaveRef.current === k;

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
        const k = chave;
        setSavingWeek(weekIndex);
        setSaveError(null);
        try {
            const salvo = await SeasonPlanService.atualizarSemana(atletaId, seasonPlanId, weekIndex, update);
            if (!vigente(k)) return false;
            setPlan(salvo);
            return true;
        } catch (err) {
            if (vigente(k)) setSaveError(seasonPlanError(err, 'Erro ao salvar a semana'));
            return false;
        } finally {
            if (vigente(k)) setSavingWeek(null);
        }
    }, [atletaId, seasonPlanId, chave]);

    /** Aprova; não troca a temporada exibida (a página navega), evitando o aviso de "já aprovado" piscar. */
    const approve = useCallback(async (reason: string): Promise<SeasonPlan | null> => {
        if (!atletaId || !seasonPlanId) return null;
        const k = chave;
        setApproving(true);
        setApproveError(null);
        try {
            const approved = await SeasonPlanService.aprovar(atletaId, seasonPlanId, reason.trim());
            return vigente(k) ? approved : null;
        } catch (err) {
            if (vigente(k)) setApproveError(seasonPlanError(err, 'Erro ao aprovar a nova versão'));
            return null;
        } finally {
            if (vigente(k)) setApproving(false);
        }
    }, [atletaId, seasonPlanId, chave]);

    const discard = useCallback(async (): Promise<boolean> => {
        if (!atletaId || !seasonPlanId) return false;
        const k = chave;
        setDiscarding(true);
        setDiscardError(null);
        try {
            await SeasonPlanService.descartar(atletaId, seasonPlanId);
            return vigente(k);
        } catch (err) {
            if (vigente(k)) setDiscardError(seasonPlanError(err, 'Erro ao descartar o ajuste'));
            return false;
        } finally {
            if (vigente(k)) setDiscarding(false);
        }
    }, [atletaId, seasonPlanId, chave]);

    /** Limpa os erros das ações (ao fechar um diálogo, o erro antigo não reaparece). */
    const clearErrors = useCallback(() => {
        setSaveError(null);
        setApproveError(null);
        setDiscardError(null);
    }, []);

    useEffect(() => {
        chaveRef.current = chave;
        setSavingWeek(null);
        setApproving(false);
        setDiscarding(false);
        clearErrors();
        void load();
        return () => {
            chaveRef.current = null;
        };
    }, [chave, load, clearErrors]);

    return {
        plan, loading, loadError, savingWeek, saveError, approving, approveError, discarding, discardError,
        reload: load, saveWeek, approve, discard, clearErrors,
    };
};
