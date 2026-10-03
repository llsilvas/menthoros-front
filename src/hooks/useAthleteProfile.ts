import { useCallback, useEffect, useRef, useState } from 'react';
import { CoachAthleteProfileService } from '../api/services/CoachAthleteProfileService';
import { ApiError } from '../api/core/ApiError';
import type { AtletaPerfilCoachDto } from '../types/AtletaPerfilCoach';

export type ErrorKind = 'timeout' | 'server_error' | null;

interface ProfileState {
    // Atleta a que este estado pertence. Estado de outro atleta nunca é exposto: sem isso, na troca
    // de atleta a tela combinava o id novo com o perfil (ou o erro) do anterior.
    forId: string | undefined;
    profile: AtletaPerfilCoachDto | null;
    isLoading: boolean;
    error: Error | null;
    errorKind: ErrorKind;
}

const EMPTY: Omit<ProfileState, 'forId'> = { profile: null, isLoading: false, error: null, errorKind: null };

export const useAthleteProfile = (atletaId: string | undefined) => {
    const [state, setState] = useState<ProfileState>({ forId: atletaId, ...EMPTY });
    // Três guardas, cada uma para um cenário que as outras não cobrem:
    // - currentIdRef: fetchProfile de uma closure antiga (atleta anterior) chamado depois da troca;
    // - requestSeqRef: duas buscas do mesmo atleta respondendo fora de ordem (refetch);
    // - state.forId: estado já gravado do atleta anterior, exposto no render da troca.
    const currentIdRef = useRef(atletaId);
    const requestSeqRef = useRef(0);

    useEffect(() => {
        currentIdRef.current = atletaId;
    }, [atletaId]);

    const fetchProfile = useCallback(async () => {
        if (!atletaId) return;
        // Um fetchProfile capturado antes da troca de atleta (ex.: callback de uma decisão que
        // terminou depois) não pode disparar busca nem invalidar a do atleta atual.
        if (atletaId !== currentIdRef.current) return;

        const seq = ++requestSeqRef.current;
        const isCurrent = () => seq === requestSeqRef.current && atletaId === currentIdRef.current;

        setState((prev) => ({
            ...(prev.forId === atletaId ? prev : EMPTY),
            forId: atletaId,
            isLoading: true,
            error: null,
            errorKind: null,
        }));
        try {
            const data = await CoachAthleteProfileService.getProfile(atletaId);
            if (!isCurrent()) return;
            setState({ forId: atletaId, profile: data, isLoading: false, error: null, errorKind: null });
        } catch (err) {
            if (!isCurrent()) return;
            const isTimeout = err instanceof ApiError && (err.status === 504 || err.status === 408);
            setState({
                forId: atletaId,
                profile: null,
                isLoading: false,
                error: isTimeout
                    ? new Error('timeout')
                    : err instanceof Error ? err : new Error('Erro ao buscar perfil do atleta'),
                errorKind: isTimeout ? 'timeout' : 'server_error',
            });
        }
    }, [atletaId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const own = state.forId === atletaId;
    const profile = own && state.profile?.atletaId === atletaId ? state.profile : null;

    return {
        profile,
        // Antes da primeira resposta do atleta novo, o estado ainda é do anterior: já é carregamento.
        isLoading: own ? state.isLoading : Boolean(atletaId),
        error: own ? state.error : null,
        errorKind: own ? state.errorKind : null,
        fetchProfile,
    };
};
