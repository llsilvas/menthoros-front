import type { Prova, CreateProva, UpdateProva } from '../../types/Prova';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ProvaService {
    /**
     * Listar provas de um atleta
     * Retorna todas as provas de um atleta, ordenadas por data ascendente
     * @param atletaId ID do atleta
     * @returns Prova[] Lista de provas
     * @throws ApiError
     */
    public static listarProvas(
        atletaId: string,
    ): CancelablePromise<Array<Prova>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/atleta/{atletaId}/provas',
            path: {
                'atletaId': atletaId,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }

    /**
     * Criar prova de atleta
     * Cadastra uma nova prova vinculada ao atleta
     * @param atletaId ID do atleta
     * @param requestBody
     * @returns Prova Prova criada com sucesso
     * @throws ApiError
     */
    public static criarProva(
        atletaId: string,
        requestBody: CreateProva,
    ): CancelablePromise<Prova> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/atleta/{atletaId}/provas',
            path: {
                'atletaId': atletaId,
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
     * Buscar prova por ID
     * Retorna os dados de uma prova específica do atleta
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @returns Prova Prova encontrada
     * @throws ApiError
     */
    public static buscarProvaPorId(
        atletaId: string,
        provaId: string,
    ): CancelablePromise<Prova> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/atleta/{atletaId}/provas/{provaId}',
            path: {
                'atletaId': atletaId,
                'provaId': provaId,
            },
            errors: {
                404: `Prova não encontrada`,
            },
        });
    }

    /**
     * Atualizar prova de atleta
     * Atualiza os dados de uma prova existente do atleta
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @param requestBody
     * @returns Prova Prova atualizada com sucesso
     * @throws ApiError
     */
    public static atualizarProva(
        atletaId: string,
        provaId: string,
        requestBody: UpdateProva,
    ): CancelablePromise<Prova> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/atleta/{atletaId}/provas/{provaId}',
            path: {
                'atletaId': atletaId,
                'provaId': provaId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Dados inválidos`,
                404: `Prova não encontrada`,
            },
        });
    }

    /**
     * Deletar prova de atleta
     * Remove permanentemente uma prova do atleta
     * @param atletaId ID do atleta
     * @param provaId ID da prova
     * @returns void
     * @throws ApiError
     */
    public static deletarProva(
        atletaId: string,
        provaId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/atleta/{atletaId}/provas/{provaId}',
            path: {
                'atletaId': atletaId,
                'provaId': provaId,
            },
            errors: {
                404: `Prova não encontrada`,
            },
        });
    }
}
