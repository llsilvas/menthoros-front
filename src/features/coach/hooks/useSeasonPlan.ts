import { useCallback, useEffect, useRef, useState } from 'react';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan } from '../../../types/SeasonPlan';
import { isSeasonPlanDisabled as isDisabled, seasonPlanError as toError } from '../adapters/seasonPlanError';

/**
 * Temporada aberta do atleta para a aba Temporada do inbox. `plan === null` sem erro = atleta sem
 * temporada (204). `disabled` = flag `season-plan.enabled` desligada no backend: a aba some (é global,
 * por isso não volta a false ao trocar de atleta). `loadError` = a leitura falhou, então não se sabe
 * se há temporada; `generateError` = a geração falhou; `approveError` = a aprovação falhou.
 */
export const useSeasonPlan = (atletaId: string | undefined) => {
    const [plan, setPlan] = useState<SeasonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [generateError, setGenerateError] = useState<Error | null>(null);
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState<Error | null>(null);
    const [adjusting, setAdjusting] = useState(false);
    const [adjustError, setAdjustError] = useState<Error | null>(null);
    // Cada requisição recebe um número; resposta de requisição superada (ex.: atleta anterior) é descartada.
    const requestRef = useRef(0);
    const atletaRef = useRef(atletaId);
    const fetchPlanRef = useRef<() => Promise<void>>(async () => {});

    const fetchPlan = useCallback(async () => {
        const request = ++requestRef.current;
        setPlan(null);
        setLoadError(null);
        setGenerateError(null);
        setGenerating(false);
        setApproveError(null);
        setApproving(false);
        setAdjustError(null);
        setAdjusting(false);
        if (!atletaId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const result = await SeasonPlanService.buscarAtual(atletaId);
            if (request === requestRef.current) setPlan(result ?? null);
        } catch (err) {
            if (request !== requestRef.current) return;
            if (isDisabled(err)) setDisabled(true);
            else setLoadError(toError(err, 'Erro ao buscar a temporada'));
        } finally {
            if (request === requestRef.current) setLoading(false);
        }
    }, [atletaId]);

    const generate = useCallback(async () => {
        if (!atletaId) return;
        const request = ++requestRef.current;
        setGenerating(true);
        setGenerateError(null);
        try {
            const result = await SeasonPlanService.gerar(atletaId);
            if (request === requestRef.current) setPlan(result);
        } catch (err) {
            if (request !== requestRef.current) return;
            if (isDisabled(err)) setDisabled(true);
            else setGenerateError(toError(err, 'Erro ao gerar a temporada'));
        } finally {
            if (request === requestRef.current) setGenerating(false);
        }
    }, [atletaId]);

    const approve = useCallback(async () => {
        if (!atletaId || !plan) return;
        const request = ++requestRef.current;
        setApproving(true);
        setApproveError(null);
        try {
            const result = await SeasonPlanService.aprovar(atletaId, plan.id);
            if (request === requestRef.current) setPlan(result);
            // Superada por troca de atleta (A → B → A): a leitura nova pode ter chegado antes da aprovação.
            else if (atletaRef.current === atletaId) void fetchPlanRef.current();
        } catch (err) {
            if (request !== requestRef.current) return;
            if (isDisabled(err)) setDisabled(true);
            else setApproveError(toError(err, 'Erro ao aprovar a temporada'));
        } finally {
            if (request === requestRef.current) setApproving(false);
        }
    }, [atletaId, plan]);

    /**
     * Abre o ajuste da temporada ACTIVE: reaproveita o já aberto (`openDraftId`) ou cria um. Devolve o id
     * do rascunho para a tela navegar, ou `null` se não deu.
     */
    const adjust = useCallback(async (): Promise<string | null> => {
        if (!atletaId || !plan || plan.seasonStatus !== 'ACTIVE') return null;
        if (plan.openDraftId) return plan.openDraftId;
        setAdjusting(true);
        setAdjustError(null);
        try {
            const draft = await SeasonPlanService.criarAjuste(atletaId, plan.id);
            return draft.id;
        } catch (err) {
            if (isDisabled(err)) setDisabled(true);
            else setAdjustError(toError(err, 'Erro ao abrir o ajuste da temporada'));
            return null;
        } finally {
            setAdjusting(false);
        }
    }, [atletaId, plan]);

    useEffect(() => {
        atletaRef.current = atletaId;
        fetchPlanRef.current = fetchPlan;
        void fetchPlan();
    }, [atletaId, fetchPlan]);

    return {
        plan, loading, generating, approving, adjusting, disabled, loadError, generateError, approveError, adjustError,
        fetchPlan, generate, approve, adjust,
    };
};
