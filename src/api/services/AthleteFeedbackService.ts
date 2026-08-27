import type { FeedbackTreinoInput } from '../../types/AthleteFeedback';
import type { TreinoRealizadoDto } from '../../types/TreinoManual';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/** "Como foi?" pós-treino do atleta autenticado (`/api/v1/atletas/me/realizados/**`). */
export class AthleteFeedbackService {
    /**
     * Grava RPE, sensações e comentário do treino; um segundo envio substitui tudo.
     * @returns TreinoRealizadoDto o realizado com o feedback já gravado
     * @throws ApiError
     */
    public static registrarFeedback(
        treinoRealizadoId: string,
        input: FeedbackTreinoInput,
    ): CancelablePromise<TreinoRealizadoDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/me/realizados/{id}/feedback',
            path: { id: treinoRealizadoId },
            body: input,
            mediaType: 'application/json',
        });
    }
}
