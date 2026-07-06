import type { EncerramentoLoteResult, EncerramentoSemanaResult } from '../../types/Encerramento';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Encerramento da semana de treino pelo treinador (`/api/v1/coach`).
 * Restrito a TECNICO/ADMIN; o tenant é resolvido no backend via `TenantContext`.
 */
export class CoachSemanaService {
    /**
     * Encerra a semana de um plano (finaliza os PENDENTE passados como PERDIDO e fecha o plano).
     * @param planoId UUID do PlanoSemanal
     * @returns resumo do encerramento (perdidos, novo status, aviso, origem)
     * @throws ApiError 403 (não treinador), 404 (plano fora do tenant), 409 (conflito concorrente)
     */
    public static encerrarSemana(planoId: string): CancelablePromise<EncerramentoSemanaResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/planos/{planoId}/encerrar-semana',
            path: { planoId },
            errors: {
                403: 'Acesso negado (requer treinador)',
                404: 'Plano não encontrado no tenant',
                409: 'Conflito de edição concorrente. Recarregue e tente novamente.',
            },
        });
    }

    /**
     * Projeta o encerramento em lote da assessoria (dry-run) — não persiste nada.
     * @returns impacto projetado (por atleta + totais)
     * @throws ApiError 403 (não treinador)
     */
    public static previewEncerrarLote(): CancelablePromise<EncerramentoLoteResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/semanas/encerrar-lote/preview',
            errors: {
                403: 'Acesso negado (requer treinador)',
            },
        });
    }

    /**
     * Encerra a semana corrente de todos os atletas da assessoria (uma transação por atleta).
     * @returns resumo consolidado (processados, concluídos, perdidos, falhas)
     * @throws ApiError 403 (não treinador)
     */
    public static encerrarLote(): CancelablePromise<EncerramentoLoteResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/semanas/encerrar-lote',
            errors: {
                403: 'Acesso negado (requer treinador)',
            },
        });
    }
}
