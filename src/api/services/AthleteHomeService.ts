import type { AthleteHome, AthleteReadiness } from '../../types/AthleteHome';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Dados do shell do atleta autenticado (`/api/v1/atletas/me/**`). Restrito a ATLETA;
 * o atleta é resolvido no backend via JWT (`resolverAtletaIdAtual()`), não recebe id no path.
 */
export class AthleteHomeService {
    /**
     * Resumo "hoje": próximo treino planejado + métricas-chave do dia.
     * @returns AthleteHome resumo do dia
     * @throws ApiError
     */
    public static getHome(): CancelablePromise<AthleteHome> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/home',
        });
    }

    /**
     * Readiness atual (score 0–100 + nota). Provisório: derivado de sinais objetivos;
     * `score` pode vir null quando não há sinais suficientes.
     * @returns AthleteReadiness readiness atual
     * @throws ApiError
     */
    public static getReadiness(): CancelablePromise<AthleteReadiness> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/readiness',
        });
    }
}
