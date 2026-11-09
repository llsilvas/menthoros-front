import type { TrajetoShareConsentDto } from '../../types/TrajetoShareConsent';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

const URL = '/api/v1/atletas/me/consentimentos/trajeto-compartilhamento';

/** Consentimento do atleta para o trajeto GPS completo aparecer nos cards (lgpd-trajeto-cards-compartilhamento). */
export class TrajetoShareConsentService {
    public static obter(): CancelablePromise<TrajetoShareConsentDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: URL,
            errors: { 403: 'Acesso negado', 404: 'Usuário não encontrado' },
        });
    }

    /**
     * Concede para a versão da Política que o aviso apresentou.
     * @throws ApiError 409 (`CONSENT_VERSION_STALE`) se a versão não é mais a vigente
     */
    public static conceder(policyVersion: string): CancelablePromise<TrajetoShareConsentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: URL,
            body: { policyVersion },
            mediaType: 'application/json',
            errors: { 400: 'Versão ausente', 403: 'Acesso negado', 409: 'Versão da Política defasada' },
        });
    }

    /** Revoga; o histórico anterior é preservado no servidor. */
    public static revogar(): CancelablePromise<TrajetoShareConsentDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: URL,
            errors: { 403: 'Acesso negado' },
        });
    }
}
