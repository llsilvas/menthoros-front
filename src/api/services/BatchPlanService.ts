import type { BatchLoteAceito, BatchPlanJobStatus, ModoGeracaoPlano } from '../../types/BatchPlanJob';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Geração assíncrona de planos de treino em lote (`/api/v1/coach`).
 * Restrito a TECNICO/ADMIN; o tenant é resolvido no backend via `TenantContext`.
 */
export class BatchPlanService {
    /**
     * Dispara a geração em lote — retorna imediatamente (202) com o jobId para polling.
     * @param atletaIds IDs dos atletas (1 a 20; duplicados são deduplicados no backend)
     * @param modo modo de geração (default PROXIMA_SEMANA)
     * @returns jobId + total de atletas do lote
     * @throws ApiError 400 (lista vazia ou > 20), 403 (não treinador)
     */
    public static gerarEmLote(
        atletaIds: string[],
        modo: ModoGeracaoPlano = 'PROXIMA_SEMANA',
    ): CancelablePromise<BatchLoteAceito> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/planos/gerar-lote',
            body: { atletaIds, modo },
            mediaType: 'application/json',
            errors: {
                400: 'Requisição inválida (informe de 1 a 20 atletas)',
                403: 'Acesso negado (requer treinador)',
            },
        });
    }

    /**
     * Consulta o estado atual de um job (polling). Detalhes por atleta só vêm no estado terminal.
     * @param jobId UUID do job
     * @returns estado atual (contadores + detalhes quando concluído)
     * @throws ApiError 403 (não treinador), 404 (job fora do tenant)
     */
    public static consultarStatus(jobId: string): CancelablePromise<BatchPlanJobStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/planos/lote/{jobId}',
            path: { jobId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Job de geração em lote não encontrado',
            },
        });
    }
}
