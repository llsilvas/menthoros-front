import { useCallback, useState } from 'react';
import { UsuarioService } from '../api/services/UsuarioService';

export interface CurrentCoach {
    id: string;
    name: string;
    avatarUrl?: string;
}

export interface CurrentTenant {
    id: string;
    name: string;
    /** follow-up: derivar de kpis.totalAtletas (add-coach-suggestion-inbox) */
    athleteCount: number;
}

export interface CurrentUserState {
    coach: CurrentCoach;
    tenant: CurrentTenant;
    loading: boolean;
    error: Error | null;
    fetchCurrentUser: () => Promise<void>;
}

const FALLBACK_COACH: CurrentCoach = { id: '', name: '' };
const FALLBACK_TENANT: CurrentTenant = { id: '', name: '', athleteCount: 0 };

/** Identidade real do coach autenticado (`GET /api/v1/users/me`). */
export const useCurrentUser = (): CurrentUserState => {
    const [coach, setCoach] = useState<CurrentCoach>(FALLBACK_COACH);
    const [tenant, setTenant] = useState<CurrentTenant>(FALLBACK_TENANT);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCurrentUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const me = await UsuarioService.getMe();
            setCoach({ id: me.id, name: me.nome });
            setTenant({
                id: me.assessoria?.id ?? '',
                name: me.assessoria?.nome ?? '',
                athleteCount: 0,
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar usuário atual'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { coach, tenant, loading, error, fetchCurrentUser };
};
