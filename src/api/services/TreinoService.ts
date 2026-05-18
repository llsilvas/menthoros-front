import type { TreinoPlanejado } from "../../types/TreinoPlanejado";
import type { TreinoRealizado } from "../../types/TreinoRealizado";
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface UpdateTreinoDto {
    percepcaoEsforco?: number;
    feedbackAtleta?: string;
    qualidadeSonoNoiteAnterior?: number;
    nivelEstresse?: number;
    fcMedia?: number;
    fcMax?: number;
    distanciaKm?: number;
    observacao?: string;
    status?: string;
}

export interface TreinoFiltros {
    atletaId?: string;
    dataInicio?: string;
    dataFim?: string;
    realizado?: boolean;
    tipoTreino?: string;
}

export class TreinoService {

    /**
     * Marcar treino como realizado
     * @param dados Dados do treino realizado
     * @returns TreinoPlanejado Treino atualizado
     * @throws ApiError
     */
    public static marcarComoRealizado(
        dados: TreinoRealizado,
    ): CancelablePromise<TreinoPlanejado> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/treinos/{treinoId}/marcar-realizado',
            path: {
                'treinoId': dados.treinoPlanejadoId as string,
            },
            body: dados,
            errors: {
                404: `Treino não encontrado`,
                400: `Dados inválidos`,
            },
        });
    }

    /**
     * Atualizar dados do treino
     * @param treinoId ID do treino
     * @param dados Dados para atualização
     * @returns TreinoPlanejado Treino atualizado
     * @throws ApiError
     */
    public static atualizarTreino(
        treinoRealizadoId: string,
        dados: UpdateTreinoDto,
    ): CancelablePromise<TreinoRealizado> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/treinos/realizados/{id}',
            path: {
                'id': treinoRealizadoId,
            },
            body: dados,
            errors: {
                404: `Treino não encontrado`,
                400: `Dados inválidos`,
            },
        });
    }

    /**
     * Listar treinos realizados por atleta
     * @param atletaId ID do atleta
     * @param filtros Filtros opcionais
     * @returns TreinoPlanejado[] Lista de treinos realizados
     * @throws ApiError
     */
    public static listarTreinosRealizados(
        atletaId: string,
        filtros?: TreinoFiltros,
    ): CancelablePromise<TreinoPlanejado[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/treinos/realizados/{atletaId}',
            path: {
                'atletaId': atletaId,
            },
            query: {
                'dataInicio': filtros?.dataInicio,
                'dataFim': filtros?.dataFim,
                'tipoTreino': filtros?.tipoTreino,
            },
            errors: {
                404: `Nenhum treino encontrado para o atleta`,
            },
        });
    }

    /**
     * Obter detalhes de um treino específico
     * @param treinoId ID do treino
     * @returns TreinoPlanejado Dados do treino
     * @throws ApiError
     */
    public static obterTreino(
        treinoId: string,
    ): CancelablePromise<TreinoPlanejado> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/treinos/{treinoId}',
            path: {
                'treinoId': treinoId,
            },
            errors: {
                404: `Treino não encontrado`,
            },
        });
    }

    /**
     * Marcar treino como perdido (não realizado)
     * @param treinoId ID do treino planejado
     * @returns void
     * @throws ApiError
     */
    public static marcarComoPerdido(
        treinoId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/treinos/{treinoId}/marcar-perdido',
            path: {
                'treinoId': treinoId,
            },
            errors: {
                404: `Treino não encontrado`,
                400: `Treino não pode ser marcado como perdido`,
            },
        });
    }

    /**
     * Desfazer realização de treino (marcar como pendente)
     * @param treinoId ID do treino
     * @returns TreinoPlanejado Treino atualizado
     * @throws ApiError
     */
    public static desfazerRealizacao(
        treinoId: string,
    ): CancelablePromise<TreinoPlanejado> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/treinos/{treinoId}/realizacao',
            path: {
                'treinoId': treinoId,
            },
            errors: {
                404: `Treino não encontrado`,
                400: `Treino não está marcado como realizado`,
            },
        });
    }

    /**
     * Busca detalhes completos da atividade no Strava e enriquece o treino.
     * Se o Garmin/Strava registrou o perceived_exertion, o RPE é preenchido automaticamente.
     */
    public static enriquecerComStrava(
        treinoRealizadoId: string,
    ): CancelablePromise<TreinoRealizado> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/treinos/realizados/{id}/enriquecer-strava',
            path: {
                'id': treinoRealizadoId,
            },
            errors: {
                400: `Treino não é proveniente do Strava`,
                404: `Treino não encontrado`,
            },
        });
    }
}