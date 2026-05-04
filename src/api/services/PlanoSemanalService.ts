import type { PlanoSemanal, MetodoGeracaoPlano } from "../../types/PlanoSemanal";
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PlanoSemanalService {

    /**
     * Listar planos semanais por atleta
     * Retorna uma lista de planos semanais associados a um atleta específico
     * @param atletaId ID do atleta
     * @returns PlanoSemanal Lista de planos semanais do atleta
     * @throws ApiError
     */
    public static listarPlanosPorAtleta(
        atletaId: string,
    ): CancelablePromise<PlanoSemanal[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/planos/{atletaId}',
            path: {
                'atletaId': atletaId,
            },
            errors: {
                404: `Nenhum plano semanal encontrado para o atleta`,
            },
        });
    }

    public static gerarPlanoSemanal(
        atletaId: string,
        modoGeracaoPlano: MetodoGeracaoPlano = 'PROXIMA_SEMANA',
    ): CancelablePromise<PlanoSemanal> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/planos/atletas/{atletaId}/gerar',
            path: {
                'atletaId': atletaId,
            },
            query: {
                'modoGeracaoPlano': modoGeracaoPlano,
            },
            errors: {
                404: `Atleta não encontrado`,
            },
        });
    }

    public static deletarPlanoSemanal(
        planoId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/planos/{planoId}',
            path: {
                'planoId': planoId,
            },
            errors: {
                404: `Plano semanal não encontrado`,
            },
        });
    }
}