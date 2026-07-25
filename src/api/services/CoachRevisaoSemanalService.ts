import type { RevisaoSemanalOutputDto } from '../../types/RevisaoSemanal';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Revisão semanal de um atleta para o coach (`GET /api/v1/coach/atletas/{atletaId}/revisao-semanal`).
 * Restrito a TECNICO/ADMIN; tenant resolvido no backend via TenantContext. 404 quando não há
 * semana fechada.
 */
export class CoachRevisaoSemanalService {
    /**
     * Última revisão congelada do atleta, com `weekOverWeekDelta`.
     * @param atletaId UUID do atleta
     * @returns RevisaoSemanalOutputDto revisão da última semana fechada
     * @throws ApiError 404 quando não há revisão
     */
    public static getRevisaoSemanal(atletaId: string): CancelablePromise<RevisaoSemanalOutputDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/v1/coach/atletas/${atletaId}/revisao-semanal`,
        });
    }
}
