import type { PlanoSemanal } from '../types/PlanoSemanal';
import type { CancelablePromise } from '../api/core/CancelablePromise';
import { OpenAPI } from '../api/core/OpenAPI';
import { request as __request } from '../api/core/request';

/**
 * Wrapper não gerado: `src/api` vem do OpenAPI (não se edita à mão) e o endpoint abaixo ainda não
 * está no client gerado. Quando `npm run generate:api` o incluir, esta classe pode sair.
 */
export class PlanoSemanasService {
    /**
     * Semanas do atleta para o dialog de planos do coach: todos os planos em andamento mais as
     * 4 últimas semanas concluídas (o limite é do backend), da mais recente para a mais antiga.
     * Lista vazia — não 404 — quando o atleta não tem plano.
     */
    public static listarSemanasDoAtleta(atletaId: string): CancelablePromise<PlanoSemanal[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/planos/atletas/{atletaId}/semanas',
            path: { atletaId },
        });
    }
}
