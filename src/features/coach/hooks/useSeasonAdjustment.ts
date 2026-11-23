import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { SeasonPlanService } from '../../../api/services/SeasonPlanService';
import type { SeasonPlan, SeasonPlanDiffEntry, SeasonPlanRecalculate, SeasonWeekUpdate } from '../../../types/SeasonPlan';
import { seasonPlanError } from '../adapters/seasonPlanError';

const emAjuste = (p: SeasonPlan) => p.seasonStatus === 'PROPOSED' && !!p.baseSeasonPlanId;
const is409 = (err: unknown) => err instanceof ApiError && err.status === 409;

/**
 * Ajuste da temporada (add-season-plan-adjust-v2, add-season-plan-version-diff): lê o rascunho e o diff
 * contra a ativa, salva uma semana por vez, recalcula pelos parâmetros, aprova com motivo e descarta. As
 * ações devolvem sucesso para a página decidir se navega; o erro fica exposto para o treinador. Resposta
 * de uma rota superada (outro rascunho) ou depois de desmontar é descartada.
 */
export const useSeasonAdjustment = (atletaId: string | undefined, seasonPlanId: string | undefined) => {
    const [plan, setPlan] = useState<SeasonPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [diff, setDiff] = useState<SeasonPlanDiffEntry[]>([]);
    const [diffError, setDiffError] = useState<Error | null>(null);
    const [savingWeek, setSavingWeek] = useState<number | null>(null);
    const [saveError, setSaveError] = useState<Error | null>(null);
    const [recalculating, setRecalculating] = useState(false);
    const [recalcError, setRecalcError] = useState<Error | null>(null);
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState<Error | null>(null);
    const [approveConflict, setApproveConflict] = useState(false);
    const [discarding, setDiscarding] = useState(false);
    const [discardError, setDiscardError] = useState<Error | null>(null);
    const [restarting, setRestarting] = useState(false);
    const [restartError, setRestartError] = useState<Error | null>(null);
    const chave = `${atletaId ?? ''}/${seasonPlanId ?? ''}`;
    // Rota atual (null depois de desmontar), a última leitura pedida e o último diff pedido.
    const chaveRef = useRef<string | null>(chave);
    const requestRef = useRef(0);
    const diffRef = useRef(0);
    const vigente = (k: string) => chaveRef.current === k;

    /** Relê o diff do rascunho; só a última leitura da rota atual vale. */
    const refreshDiff = useCallback(async (k: string, atual: SeasonPlan) => {
        const request = ++diffRef.current;
        const valida = () => request === diffRef.current && chaveRef.current === k;
        setDiffError(null);
        if (!atletaId || !emAjuste(atual)) {
            setDiff([]);
            return;
        }
        try {
            const lido = await SeasonPlanService.buscarDiff(atletaId, atual.id);
            if (valida()) setDiff(lido);
        } catch (err) {
            if (valida()) {
                // O diff anterior não corresponde mais ao rascunho: sem ele a tabela não risca valor errado.
                setDiff([]);
                setDiffError(seasonPlanError(err, 'Erro ao carregar as alterações'));
            }
        }
    }, [atletaId]);

    const load = useCallback(async () => {
        const request = ++requestRef.current;
        const k = chave;
        setLoadError(null);
        if (!atletaId || !seasonPlanId) {
            setPlan(null);
            setDiff([]);
            return;
        }
        setLoading(true);
        try {
            const result = await SeasonPlanService.buscarPorId(atletaId, seasonPlanId);
            if (request !== requestRef.current) return;
            setPlan(result);
            await refreshDiff(k, result);
        } catch (err) {
            if (request === requestRef.current) setLoadError(seasonPlanError(err, 'Erro ao carregar o ajuste da temporada'));
        } finally {
            if (request === requestRef.current) setLoading(false);
        }
    }, [atletaId, seasonPlanId, chave, refreshDiff]);

    const saveWeek = useCallback(async (weekIndex: number, update: SeasonWeekUpdate): Promise<boolean> => {
        if (!atletaId || !seasonPlanId) return false;
        const k = chave;
        setSavingWeek(weekIndex);
        setSaveError(null);
        try {
            const salvo = await SeasonPlanService.atualizarSemana(atletaId, seasonPlanId, weekIndex, update);
            if (!vigente(k)) return false;
            setPlan(salvo);
            void refreshDiff(k, salvo);
            return true;
        } catch (err) {
            if (vigente(k)) setSaveError(seasonPlanError(err, 'Erro ao salvar a semana'));
            return false;
        } finally {
            if (vigente(k)) setSavingWeek(null);
        }
    }, [atletaId, seasonPlanId, chave, refreshDiff]);

    const recalculate = useCallback(async (input: SeasonPlanRecalculate): Promise<boolean> => {
        if (!atletaId || !seasonPlanId) return false;
        const k = chave;
        setRecalculating(true);
        setRecalcError(null);
        try {
            const recalculado = await SeasonPlanService.recalcular(atletaId, seasonPlanId, input);
            if (!vigente(k)) return false;
            setPlan(recalculado);
            void refreshDiff(k, recalculado);
            return true;
        } catch (err) {
            if (vigente(k)) setRecalcError(seasonPlanError(err, 'Erro ao recalcular o ajuste'));
            return false;
        } finally {
            if (vigente(k)) setRecalculating(false);
        }
    }, [atletaId, seasonPlanId, chave, refreshDiff]);

    /**
     * Aprova; não troca a temporada exibida (a página navega), evitando o aviso de "já aprovado" piscar.
     * O 409 (a ativa mudou depois do ajuste) liga `approveConflict` para a página oferecer recomeçar.
     */
    const approve = useCallback(async (reason: string): Promise<SeasonPlan | null> => {
        if (!atletaId || !seasonPlanId) return null;
        const k = chave;
        setApproving(true);
        setApproveError(null);
        setApproveConflict(false);
        try {
            const approved = await SeasonPlanService.aprovar(atletaId, seasonPlanId, reason.trim());
            return vigente(k) ? approved : null;
        } catch (err) {
            if (!vigente(k)) return null;
            if (is409(err)) setApproveConflict(true);
            else setApproveError(seasonPlanError(err, 'Erro ao aprovar a nova versão'));
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

    /**
     * Depois do conflito: descarta este rascunho e abre outro a partir da temporada ativa atual.
     * Devolve o id do rascunho novo. Um 409 no descarte (rascunho já descartado por outra sessão) não impede.
     */
    const restart = useCallback(async (): Promise<string | null> => {
        if (!atletaId || !seasonPlanId) return null;
        const k = chave;
        setRestarting(true);
        setRestartError(null);
        try {
            await SeasonPlanService.descartar(atletaId, seasonPlanId).catch((err: unknown) => {
                if (!is409(err)) throw err;
            });
            const ativa = await SeasonPlanService.buscarAtual(atletaId);
            if (!ativa || ativa.seasonStatus !== 'ACTIVE') throw new Error('O atleta não tem temporada ativa para ajustar');
            const novo = await SeasonPlanService.criarAjuste(atletaId, ativa.id);
            return vigente(k) ? novo.id : null;
        } catch (err) {
            if (vigente(k)) setRestartError(seasonPlanError(err, 'Erro ao recomeçar o ajuste'));
            return null;
        } finally {
            if (vigente(k)) setRestarting(false);
        }
    }, [atletaId, seasonPlanId, chave]);

    /** Limpa os erros das ações (ao fechar um diálogo, o erro antigo não reaparece). */
    const clearErrors = useCallback(() => {
        setSaveError(null);
        setRecalcError(null);
        setApproveError(null);
        setDiscardError(null);
        setRestartError(null);
    }, []);

    useEffect(() => {
        chaveRef.current = chave;
        setDiff([]);
        setSavingWeek(null);
        setRecalculating(false);
        setApproving(false);
        setApproveConflict(false);
        setDiscarding(false);
        setRestarting(false);
        clearErrors();
        void load();
        return () => {
            chaveRef.current = null;
        };
    }, [chave, load, clearErrors]);

    return {
        plan, loading, loadError, diff, diffError, savingWeek, saveError, recalculating, recalcError,
        approving, approveError, approveConflict, discarding, discardError, restarting, restartError,
        reload: load, saveWeek, recalculate, approve, discard, restart, clearErrors,
    };
};
