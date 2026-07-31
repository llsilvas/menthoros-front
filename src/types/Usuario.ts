export type UserRole = 'TECNICO' | 'ADMIN' | 'ATLETA';

export interface UsuarioAssessoria {
    id: string;
    nome: string;
    dominio?: string;
}

export interface UsuarioMeOutputDto {
    id: string;
    nome: string;
    email: string;
    /** URL do avatar sincronizada do Keycloak. Externa — renderizar com `referrerPolicy`. */
    avatarUrl?: string;
    role: UserRole;
    assessoria?: UsuarioAssessoria;
    atletaId?: string;
    /**
     * Se o usuário já aceitou as versões **vigentes** da Política e dos Termos.
     * Derivado no backend — volta a `false` quando uma das versões vigentes muda.
     */
    lgpdConsentGranted: boolean;
    /**
     * Data de vigência da Política em vigor; deve ser ecoada ao registrar o aceite.
     * Não é opcional: o backend a lê de `app.lgpd.policy-version`, que é `@NotBlank` e derruba o
     * boot se faltar. Marcá-la opcional aqui convidaria a um fallback que mascararia bug de
     * integração como "versão desatualizada".
     */
    lgpdCurrentPolicyVersion: string;
    /** Data de vigência dos Termos em vigor; mesma garantia da Política. */
    lgpdCurrentTermsVersion: string;
    /** Momento do último aceite; ausente quando nunca consentiu. */
    lgpdConsentedAt?: string;
    /**
     * Versão da Política efetivamente aceita. Pode ser **anterior** à vigente — nesse caso
     * `lgpdConsentGranted` é `false`, e é a diferença entre as duas que explica ao coach por que o
     * consentimento voltou a ser pedido.
     */
    lgpdAcceptedPolicyVersion?: string;
    /** Versão dos Termos efetivamente aceita; mesma semântica da Política. */
    lgpdAcceptedTermsVersion?: string;
}

/**
 * Aceite dos Termos de Uso e da Política de Privacidade.
 *
 * As versões enviadas são as que o cliente **efetivamente renderizou**, nunca constantes locais: o
 * backend recusa com `409 CONSENT_VERSION_STALE` se estiverem defasadas, para o registro jamais
 * afirmar que o usuário aceitou um texto que não viu.
 */
export interface ConsentInputDto {
    termsAccepted: boolean;
    privacyPolicyAccepted: boolean;
    policyVersion: string;
    termsVersion: string;
}
