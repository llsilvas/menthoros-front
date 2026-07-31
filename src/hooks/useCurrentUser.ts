import { useCallback, useState } from 'react';
import { UsuarioService } from '../api/services/UsuarioService';

export interface CurrentCoach {
    id: string;
    name: string;
    /** URL externa vinda do Keycloak; renderizar com `referrerPolicy="no-referrer"`. */
    avatarUrl?: string;
    email?: string;
}

export interface CurrentTenant {
    id: string;
    name: string;
    /** follow-up: derivar de kpis.totalAtletas (add-coach-suggestion-inbox) */
    athleteCount: number;
}

/** Estado de consentimento LGPD do usuário autenticado, como o backend o computou. */
export interface CurrentConsent {
    /** Já aceitou as versões vigentes? `null` enquanto `me` não carregou. */
    granted: boolean | null;
    /** Versões em vigor, que o cliente deve ecoar ao registrar o aceite. */
    policyVersion: string;
    termsVersion: string;
    /** Último aceite registrado; ausente quando nunca consentiu. */
    consentedAt?: string;
    /** Versões efetivamente aceitas — podem ser anteriores às vigentes. */
    acceptedPolicyVersion?: string;
    acceptedTermsVersion?: string;
}

export interface CurrentUserState {
    coach: CurrentCoach;
    tenant: CurrentTenant;
    consent: CurrentConsent;
    loading: boolean;
    error: Error | null;
    fetchCurrentUser: () => Promise<void>;
}

const FALLBACK_COACH: CurrentCoach = { id: '', name: '' };
const FALLBACK_TENANT: CurrentTenant = { id: '', name: '', athleteCount: 0 };
// granted: null = indefinido. Distinguir de `false` importa: `false` renderiza o modal bloqueante,
// e assumi-lo antes de `me` responder faria o modal piscar em todo carregamento.
const FALLBACK_CONSENT: CurrentConsent = { granted: null, policyVersion: '', termsVersion: '' };

/** Identidade real do coach autenticado (`GET /api/v1/users/me`). */
export const useCurrentUser = (): CurrentUserState => {
    const [coach, setCoach] = useState<CurrentCoach>(FALLBACK_COACH);
    const [tenant, setTenant] = useState<CurrentTenant>(FALLBACK_TENANT);
    const [consent, setConsent] = useState<CurrentConsent>(FALLBACK_CONSENT);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCurrentUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const me = await UsuarioService.getMe();
            setCoach({ id: me.id, name: me.nome, avatarUrl: me.avatarUrl, email: me.email });
            setTenant({
                id: me.assessoria?.id ?? '',
                name: me.assessoria?.nome ?? '',
                athleteCount: 0,
            });
            setConsent({
                granted: me.lgpdConsentGranted,
                policyVersion: me.lgpdCurrentPolicyVersion,
                termsVersion: me.lgpdCurrentTermsVersion,
                consentedAt: me.lgpdConsentedAt,
                acceptedPolicyVersion: me.lgpdAcceptedPolicyVersion,
                acceptedTermsVersion: me.lgpdAcceptedTermsVersion,
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao buscar usuário atual'));
        } finally {
            setLoading(false);
        }
    }, []);

    return { coach, tenant, consent, loading, error, fetchCurrentUser };
};
