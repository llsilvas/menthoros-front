
import type { Atleta, CreateAtleta } from '../../types/Atleta';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AtletasService {
    /**
     * Buscar atleta por ID
     * Retorna os dados de um atleta específico
     * @param id ID do atleta
     * @returns AtletaOutputDto Atleta encontrado
     * @throws ApiError
     */
    public static buscarAtletaPorId(
        id: string,
    ): CancelablePromise<Atleta> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/atletas/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }
    /**
     * Atualizar atleta
     * Atualiza os dados de um atleta existente
     * @param id ID do atleta
     * @param requestBody
     * @returns AtletaOutputDto Atleta atualizado com sucesso
     * @throws ApiError
     */
    public static atualizarAtleta(
        id: string,
        requestBody: CreateAtleta,
    ): CancelablePromise<Atleta> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/atletas/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Dados inválidos`,
                404: `Atleta não encontrado`,
            },
        });
    }
    /**
     * Deletar atleta
     * Remove um atleta do sistema (soft delete)
     * @param id ID do atleta
     * @returns void
     * @throws ApiError
     */
    public static deletarAtleta(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/atletas/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }
    /**
     * Listar atletas
     * Retorna atletas ativos com filtros opcionais por nome, nível e lesão
     * @param nome Filtrar por nome (busca parcial, case-insensitive)
     * @param nivelExperiencia Filtrar por nível de experiência
     * @param temLesao Filtrar por presença de lesão
     * @returns AtletaOutputDto Lista de atletas retornada com sucesso
     * @throws ApiError
     */
    public static listarAtletas(
        nome?: string,
        nivelExperiencia?: string,
        temLesao?: boolean,
    ): CancelablePromise<Array<Atleta>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/atletas',
            query: {
                'nome': nome,
                'nivelExperiencia': nivelExperiencia,
                'temLesao': temLesao,
            },
        });
    }
    /**
     * Cadastrar novo atleta
     * Cria um novo atleta no sistema
     * @param requestBody
     * @returns AtletaOutputDto Atleta criado com sucesso
     * @throws ApiError
     */
    public static cadastraAtleta(
        requestBody: CreateAtleta,
    ): CancelablePromise<Atleta> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Dados inválidos`,
                409: `Atleta já existe`,
            },
        });
    }
    /**
     * Recalcular métricas do atleta
     * Recalcula as métricas de um atleta específico
     * @param id ID do atleta
     * @returns void
     * @throws ApiError
     */
    public static recalcularMetricas(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/atletas/{id}/recalcular-metricas',
            path: {
                'id': id,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }
}
