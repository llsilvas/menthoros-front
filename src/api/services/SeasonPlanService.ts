import type { SeasonPlan } from '../../types/SeasonPlan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Plano de temporada do atleta (`/api/v1/atletas/{atletaId}/season-plans`).
 * Restrito a TECNICO/ADMIN. Com a flag `season-plan.enabled` desligada, os dois endpoints
 * respondem 404 com `body.code === 'SEASON_PLAN_DISABLED'`.
 */
export class SeasonPlanService {
    /**
     * Temporada aberta do atleta: a ACTIVE, senão a PROPOSED.
     * @returns a temporada, ou `undefined` quando não há nenhuma (204)
     */
    public static buscarAtual(atletaId: string): CancelablePromise<SeasonPlan | undefined> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/season-plans/current',
            path: { atletaId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Não encontrado',
            },
        });
    }

    /**
     * Gera a proposta de temporada até a prova-alvo (201), ou devolve a proposta que já existe (200).
     * @throws ApiError 409 (temporada ativa ou proposta de outra prova), 422 (sem prova-alvo ou base)
     */
    public static gerar(atletaId: string): CancelablePromise<SeasonPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/season-plans',
            path: { atletaId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Não encontrado',
                409: 'Já existe uma temporada em aberto para este atleta',
                422: 'Não foi possível gerar a temporada',
            },
        });
    }
}
