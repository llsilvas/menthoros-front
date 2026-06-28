import type { PmcHistoricoPonto } from '../../types/MetricasPmc';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Progresso read-only do atleta (`/api/v1/atletas/{id}/**`). Endpoints por `{id}` são
 * restritos a TECNICO/ADMIN; o isolamento de tenant é garantido na camada de serviço
 * do backend (consulta tenant-scoped → 404 cross-tenant). Nunca usa rotas `me/*`.
 */
export class AtletaProgressService {
    /**
     * Histórico PMC (série diária CTL/ATL/TSB/TSS) de um atleta do tenant.
     * @param atletaId UUID do atleta
     * @param from início do intervalo (ISO `yyyy-MM-dd`); default 90 dias atrás no backend
     * @param to fim do intervalo (ISO `yyyy-MM-dd`); default hoje no backend
     * @returns série PMC do intervalo
     * @throws ApiError
     */
    public static getHistoricoPmc(
        atletaId: string,
        from?: string,
        to?: string,
    ): CancelablePromise<Array<PmcHistoricoPonto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/v1/atletas/${atletaId}/metricas/historico`,
            query: {
                'from': from,
                'to': to,
            },
        });
    }
}
