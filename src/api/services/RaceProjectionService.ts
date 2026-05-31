import type {
    GenerateRaceProjectionRequest,
    RaceProjectionSnapshot,
    AthleteProjectionView,
} from '../../types/RaceProjection';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RaceProjectionService {
    /**
     * Gerar projeção de tempo de prova
     * Executa a pipeline de 3 camadas + LLM e persiste o snapshot
     * @param atletaId ID do atleta
     * @param requestBody dados para geração da projeção
     * @returns RaceProjectionSnapshot Snapshot criado com sucesso
     * @throws ApiError
     */
    public static gerarProjecao(
        atletaId: string,
        requestBody: GenerateRaceProjectionRequest,
    ): CancelablePromise<RaceProjectionSnapshot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{atletaId}/projecoes-prova',
            path: {
                'atletaId': atletaId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Parâmetros inválidos`,
                403: `Acesso negado — apenas TECNICO e ADMIN`,
                404: `Atleta não encontrado`,
            },
        });
    }

    /**
     * Histórico de projeções
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @returns RaceProjectionSnapshot[] lista do mais recente ao mais antigo
     * @throws ApiError
     */
    public static listarHistorico(
        atletaId: string,
        provaId: string,
    ): CancelablePromise<RaceProjectionSnapshot[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/projecoes-prova',
            path: {
                'atletaId': atletaId,
            },
            query: {
                'provaId': provaId,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }

    /**
     * Projeção oficial atual
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @returns RaceProjectionSnapshot snapshot oficial
     * @throws ApiError
     */
    public static buscarOficial(
        atletaId: string,
        provaId: string,
    ): CancelablePromise<RaceProjectionSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/projecoes-prova/oficial',
            path: {
                'atletaId': atletaId,
            },
            query: {
                'provaId': provaId,
            },
            errors: {
                404: `Nenhuma projeção oficial encontrada`,
            },
        });
    }

    /**
     * Marcar projeção como oficial
     * @param atletaId ID do atleta
     * @param snapshotId ID do snapshot
     * @param provaId ID da prova
     * @returns RaceProjectionSnapshot snapshot marcado como oficial
     * @throws ApiError
     */
    public static marcarComoOficial(
        atletaId: string,
        snapshotId: string,
        provaId: string,
    ): CancelablePromise<RaceProjectionSnapshot> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/atletas/{atletaId}/projecoes-prova/{snapshotId}/oficial',
            path: {
                'atletaId': atletaId,
                'snapshotId': snapshotId,
            },
            query: {
                'provaId': provaId,
            },
            errors: {
                403: `Acesso negado`,
                404: `Snapshot não encontrado`,
            },
        });
    }

    /**
     * Visão simplificada para o atleta
     * Retorna a projeção oficial revisada, sem campos coach-only
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @returns AthleteProjectionView visão simplificada
     * @throws ApiError
     */
    public static buscarVisaoAtleta(
        atletaId: string,
        provaId: string,
    ): CancelablePromise<AthleteProjectionView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas/{atletaId}/projecoes-prova/visao-atleta',
            path: {
                'atletaId': atletaId,
            },
            query: {
                'provaId': provaId,
            },
            errors: {
                404: `Nenhuma projeção oficial revisada encontrada`,
            },
        });
    }
}
