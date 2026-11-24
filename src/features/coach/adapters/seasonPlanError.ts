import { ApiError } from '../../../api/core/ApiError';

/** Flag `season-plan.enabled` desligada no backend: 404 com `code === 'SEASON_PLAN_DISABLED'`. */
export const isSeasonPlanDisabled = (err: unknown): boolean =>
    err instanceof ApiError && err.status === 404 && err.body?.code === 'SEASON_PLAN_DISABLED';

/** Erro da temporada para a tela: a `message` do backend (escrita para o treinador) ou o texto padrão. */
export const seasonPlanError = (err: unknown, fallback: string): Error =>
    err instanceof ApiError && typeof err.body?.message === 'string'
        ? new Error(err.body.message)
        : err instanceof Error ? err : new Error(fallback);
