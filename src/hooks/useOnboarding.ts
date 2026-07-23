import { useCallback, useState } from 'react';
import { OnboardingService } from '../api/services/OnboardingService';
import { resolverAtletaIdAtual } from './resolverAtletaId';
import type { AthleteOnboardingProfile, OnboardingConclusaoInput, OnboardingConclusaoResult, OnboardingDraftInput } from '../types/Onboarding';

/**
 * Onboarding de um atleta. Por padrão resolve o `atletaId` via `GET /users/me` (fluxo do próprio
 * atleta autenticado). Quando `atletaIdParam` é informado (coach-como-proxy, rota
 * `/coach/athletes/:atletaId/onboarding`), usa esse id diretamente e pula a resolução via
 * `getMe()` — o backend já deriva `preenchidoPorCoach` do papel do chamador via JWT, sem precisar
 * de nenhum flag extra no client (athlete-onboarding-baseline, CA7). Busca o rascunho existente
 * para retomar (CA8) e expõe `updateDraft`/`saveDraft`/`concluir` para o formulário multi-etapa.
 */
export const useOnboarding = (atletaIdParam?: string) => {
    const [atletaId, setAtletaId] = useState<string | null>(atletaIdParam ?? null);
    const [draft, setDraft] = useState<OnboardingDraftInput>({});
    const [profile, setProfile] = useState<AthleteOnboardingProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Erro do carregamento inicial (bloqueia a tela) — distinto de erros de saveDraft/concluir,
    // que são lançados para o chamador tratar localmente (toast), sem esconder o formulário.
    const [fetchError, setFetchError] = useState<Error | null>(null);

    const fetchDraft = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const idAtual = atletaIdParam ?? await resolverAtletaIdAtual();
            if (!idAtual) {
                setFetchError(new Error('Usuário sem atleta vinculado'));
                return;
            }
            setAtletaId(idAtual);
            const existente = await OnboardingService.buscarRascunho(idAtual);
            if (existente) {
                setProfile(existente);
                setDraft(existente);
            }
        } catch (err) {
            setFetchError(err instanceof Error ? err : new Error('Erro ao carregar onboarding'));
        } finally {
            setLoading(false);
        }
    }, [atletaIdParam]);

    const updateDraft = useCallback((patch: Partial<OnboardingDraftInput>) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    }, []);

    const saveDraft = useCallback(async (): Promise<AthleteOnboardingProfile> => {
        if (!atletaId) throw new Error('Atleta não resolvido');
        setSaving(true);
        try {
            const salvo = await OnboardingService.salvarRascunho(atletaId, draft);
            setProfile(salvo);
            return salvo;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Erro ao salvar rascunho');
        } finally {
            setSaving(false);
        }
    }, [atletaId, draft]);

    const concluir = useCallback(async (input: OnboardingConclusaoInput): Promise<OnboardingConclusaoResult> => {
        if (!atletaId) throw new Error('Atleta não resolvido');
        setSaving(true);
        try {
            return await OnboardingService.concluirOnboarding(atletaId, input);
        } catch (err) {
            throw err instanceof Error ? err : new Error('Erro ao concluir onboarding');
        } finally {
            setSaving(false);
        }
    }, [atletaId]);

    return { atletaId, draft, profile, loading, saving, fetchError, fetchDraft, updateDraft, saveDraft, concluir };
};
