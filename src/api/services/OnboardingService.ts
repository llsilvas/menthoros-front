
import type { AthleteOnboardingProfile, OnboardingConclusaoInput, OnboardingConclusaoResult, OnboardingDraftInput } from '../../types/Onboarding';
import type { CalibrationStatus } from '../../types/Calibracao';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Onboarding do atleta e status de calibração (athlete-onboarding-baseline). Acesso: o próprio
 * atleta (dono) ou qualquer TECNICO/ADMIN do tenant (coach-como-proxy) — enforçado pelo backend,
 * não pelo client.
 */
export class OnboardingService {
    /**
     * Salva (cria ou atualiza) o rascunho de onboarding — parcial ou completo.
     * @throws ApiError 400 (validação), 403 (atleta tentando editar onboarding de outro), 404 (atleta não encontrado)
     */
    public static salvarRascunho(
        atletaId: string,
        requestBody: OnboardingDraftInput,
    ): CancelablePromise<AthleteOnboardingProfile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/onboarding',
            path: { atletaId },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: 'Dados inválidos',
                403: 'Acesso negado',
                404: 'Atleta não encontrado',
            },
        });
    }

    /**
     * Recupera o rascunho salvo (CA8, retomar onboarding interrompido). Retorna `undefined`
     * quando o atleta ainda não iniciou o onboarding (204 No Content).
     * @throws ApiError 403 (atleta tentando ler onboarding de outro)
     */
    public static buscarRascunho(atletaId: string): CancelablePromise<AthleteOnboardingProfile | undefined> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/onboarding',
            path: { atletaId },
            errors: {
                403: 'Acesso negado',
            },
        });
    }

    /**
     * Conclui o onboarding: migra os dados do rascunho, cria/atualiza a prova alvo (CA13) e
     * calcula o baseline/score iniciais.
     * @throws ApiError 400 (validação), 403 (acesso negado), 404 (atleta ou rascunho não encontrado), 409 (Atleta editado após o início do rascunho — reenviar o rascunho atualizado)
     */
    public static concluirOnboarding(
        atletaId: string,
        requestBody: OnboardingConclusaoInput,
    ): CancelablePromise<OnboardingConclusaoResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/onboarding/concluir',
            path: { atletaId },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: 'Dados inválidos',
                403: 'Acesso negado',
                404: 'Atleta ou rascunho não encontrado',
                409: 'Atleta foi editado após o início do rascunho',
            },
        });
    }

    /**
     * Status de calibração para o `CalibrationBanner`. Retorna `undefined` quando o atleta não
     * está em calibração (204 No Content).
     * @throws ApiError 403 (atleta tentando ler status de outro)
     */
    public static obterStatusCalibracao(atletaId: string): CancelablePromise<CalibrationStatus | undefined> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/calibracao',
            path: { atletaId },
            errors: {
                403: 'Acesso negado',
            },
        });
    }
}
