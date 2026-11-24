import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../api/core/ApiError';
import { isSeasonPlanDisabled, seasonPlanError } from './seasonPlanError';

const apiError = (status: number, body: unknown) =>
    new ApiError({ method: 'GET', url: '' }, { url: '', ok: false, status, statusText: '', body }, 'erro');

describe('seasonPlanError', () => {
    it('usa a message do backend', () => {
        expect(seasonPlanError(apiError(422, { message: 'Semana travada' }), 'padrão').message).toBe('Semana travada');
    });

    it('sem message do backend, mantém o Error ou usa o texto padrão', () => {
        expect(seasonPlanError(new Error('rede'), 'padrão').message).toBe('rede');
        expect(seasonPlanError('???', 'padrão').message).toBe('padrão');
    });

    it('flag desligada só com 404 e o code SEASON_PLAN_DISABLED', () => {
        expect(isSeasonPlanDisabled(apiError(404, { code: 'SEASON_PLAN_DISABLED' }))).toBe(true);
        expect(isSeasonPlanDisabled(apiError(404, { message: 'não encontrado' }))).toBe(false);
        expect(isSeasonPlanDisabled(apiError(409, { code: 'SEASON_PLAN_DISABLED' }))).toBe(false);
    });
});
