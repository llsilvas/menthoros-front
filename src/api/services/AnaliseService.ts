import type { AnaliseWorkout } from '../../types/AnaliseWorkout';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AnaliseService {

    /**
     * Busca a análise pós-treino gerada por IA para um treino realizado.
     * Retorna null quando a análise ainda não foi concluída (HTTP 204).
     */
    public static getAnaliseTreino(
        treinoRealizadoId: string,
    ): CancelablePromise<AnaliseWorkout> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/analises/treino/{treinoRealizadoId}',
            path: {
                'treinoRealizadoId': treinoRealizadoId,
            },
            errors: {
                404: 'Treino não encontrado ou não pertence ao tenant',
            },
        });
    }
}
