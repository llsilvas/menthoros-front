import type { MotivoPulo, TreinoHoje } from '../../types/AthleteWorkoutToday';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Modo treino do atleta autenticado (`/api/v1/atletas/me/treinos/hoje`). Restrito a ATLETA;
 * o atleta é resolvido no backend via JWT, não recebe id no path.
 */
export class AthleteWorkoutTodayService {
    /**
     * Treino planejado de hoje com alvos por etapa. `undefined` quando não há treino hoje (204).
     * @returns TreinoHoje treino de hoje
     * @throws ApiError
     */
    public static getTreinoHoje(): CancelablePromise<TreinoHoje | undefined> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/treinos/hoje',
        });
    }

    /**
     * "Não vou conseguir hoje" — marca o planejado de hoje como PERDIDO. Motivo opcional.
     * @returns TreinoHoje treino de hoje já com o pulo
     * @throws ApiError
     */
    public static pularHoje(motivo?: MotivoPulo): CancelablePromise<TreinoHoje> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/me/treinos/hoje/pular',
            body: motivo ? { motivo } : undefined,
            mediaType: 'application/json',
        });
    }
}
