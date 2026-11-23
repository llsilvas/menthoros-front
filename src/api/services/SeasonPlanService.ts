import type { AthleteSeasonPlan, SeasonPlan, SeasonWeekUpdate } from '../../types/SeasonPlan';
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

    /**
     * Aprova a temporada proposta: vira ACTIVE. Aprovar uma ACTIVE devolve a mesma (idempotente).
     * Um ajuste (versão 2 em diante) exige `reason` e arquiva a ACTIVE anterior.
     * @throws ApiError 409 (arquivada, outra ativa, ou a ativa mudou depois do ajuste), 422 (prova
     *         cancelada, atleta em calibração, ou motivo ausente/longo demais)
     */
    public static aprovar(atletaId: string, seasonPlanId: string, reason?: string): CancelablePromise<SeasonPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/season-plans/{seasonPlanId}/approve',
            path: { atletaId, seasonPlanId },
            body: reason === undefined ? undefined : { reason },
            mediaType: 'application/json',
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Não encontrado',
                409: 'A temporada não pode mais ser aprovada',
                422: 'A temporada não pode ser aprovada',
            },
        });
    }

    /**
     * Cria o ajuste (rascunho da próxima versão) da temporada ACTIVE (201), ou devolve o já aberto (200).
     * @throws ApiError 409 (a temporada não é a ativa, ou há outra proposta aberta)
     */
    public static criarAjuste(atletaId: string, seasonPlanId: string): CancelablePromise<SeasonPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/season-plans/{seasonPlanId}/draft',
            path: { atletaId, seasonPlanId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Não encontrado',
                409: 'Não foi possível ajustar esta temporada',
            },
        });
    }

    /** Qualquer versão da temporada do atleta, inclusive o ajuste em aberto. */
    public static buscarPorId(atletaId: string, seasonPlanId: string): CancelablePromise<SeasonPlan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/season-plans/{seasonPlanId}',
            path: { atletaId, seasonPlanId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Temporada não encontrada',
            },
        });
    }

    /**
     * Edita uma semana do ajuste; devolve a temporada inteira com as validações recalculadas.
     * @throws ApiError 409 (não está em ajuste), 422 (semana travada, fase ou valor inválido)
     */
    public static atualizarSemana(atletaId: string, seasonPlanId: string, weekIndex: number,
                                  body: SeasonWeekUpdate): CancelablePromise<SeasonPlan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/atletas/{atletaId}/season-plans/{seasonPlanId}/weeks/{weekIndex}',
            path: { atletaId, seasonPlanId, weekIndex },
            body,
            mediaType: 'application/json',
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Semana não encontrada',
                409: 'A temporada não está mais em ajuste',
                422: 'Não foi possível salvar a semana',
            },
        });
    }

    /**
     * Descarta o ajuste (vira ARCHIVED); a temporada ativa continua.
     * @throws ApiError 409 (não é um ajuste em aberto)
     */
    public static descartar(atletaId: string, seasonPlanId: string): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/atletas/{atletaId}/season-plans/{seasonPlanId}',
            path: { atletaId, seasonPlanId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Não encontrado',
                409: 'O ajuste já foi aprovado ou descartado',
            },
        });
    }

    /**
     * Temporada aprovada do atleta autenticado (`/api/v1/atletas/me/season-plan`, papel ATLETA).
     * @returns a temporada, ou `undefined` quando não há aprovada visível (204, inclusive com a flag desligada)
     */
    public static buscarMinha(): CancelablePromise<AthleteSeasonPlan | undefined> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/season-plan',
            errors: {
                403: 'Acesso negado (requer atleta)',
                404: 'Atleta não encontrado',
            },
        });
    }
}
