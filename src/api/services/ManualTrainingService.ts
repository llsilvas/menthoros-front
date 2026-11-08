import type { GpsTrace, TreinoManualInput, TreinoRealizadoDto } from '../../types/TreinoManual';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Serviço curado para registro de treinos manuais pelo próprio atleta.
 * Endpoints: POST e GET /api/v1/atletas/me/treinos (requer role ATLETA).
 */
export class ManualTrainingService {
    /**
     * Registra um treino realizado manualmente pelo atleta autenticado.
     * @param input dados do treino
     * @returns treino salvo
     * @throws ApiError 400 (validação), 422 (data > 7 dias), 403 (não ATLETA)
     */
    public static registrar(input: TreinoManualInput): CancelablePromise<TreinoRealizadoDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/me/treinos',
            body: input,
            mediaType: 'application/json',
            errors: {
                400: 'Dados inválidos',
                403: 'Acesso negado',
                422: 'Regra violada: data não pode ser anterior a 7 dias',
            },
        });
    }

    /**
     * Lista treinos recentes do atleta autenticado (máx 30 dias).
     * @param dias janela de consulta em dias (default 7, máx 30)
     * @returns lista de treinos realizados, ordenados por data DESC
     * @throws ApiError 403 (não ATLETA)
     */
    public static listarRecentes(dias = 7): CancelablePromise<Array<TreinoRealizadoDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/treinos',
            query: { 'dias': dias },
            errors: {
                403: 'Acesso negado',
            },
        });
    }

    /**
     * Trajeto GPS simplificado de um treino realizado do atleta (add-activity-gps-trace).
     * Chamar só quando `TreinoRealizadoDto.temTrajeto` for true.
     * @throws ApiError 404 (sem trajeto, de outro atleta ou de outro tenant), 403 (não ATLETA)
     */
    public static getTrajeto(treinoId: string): CancelablePromise<GpsTrace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/me/realizados/{id}/trajeto',
            path: { id: treinoId },
            errors: {
                403: 'Acesso negado',
                404: 'Treino sem trajeto GPS',
            },
        });
    }
}
