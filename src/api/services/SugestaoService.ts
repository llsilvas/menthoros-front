import type { SugestaoCoachOutputDto, SugestaoStatus } from '../../types/SugestaoCoach';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Sugestões de IA do coach (`/api/v1/coach/sugestoes`). Restrito a TECNICO/ADMIN;
 * o tenant é resolvido no backend via `TenantContext`.
 */
export class SugestaoService {
    /**
     * Lista sugestões do tenant filtradas por status.
     * Para `status=PENDING`, o backend exclui sugestões expiradas.
     * @param status filtro; omitir retorna lista vazia (backend exige status explícito para resultado útil)
     * @returns lista de sugestões
     * @throws ApiError
     */
    public static listar(status?: SugestaoStatus): CancelablePromise<Array<SugestaoCoachOutputDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/sugestoes',
            query: { 'status': status },
        });
    }

    /**
     * Aprova uma sugestão PENDING (PENDING → APPROVED).
     * Re-aprovar já-APPROVED é no-op. REJECTED → APPROVED lança 422.
     * @param id UUID da sugestão
     * @returns sugestão atualizada
     * @throws ApiError
     */
    public static aprovar(id: string): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/sugestoes/{id}/aprovar',
            path: { 'id': id },
            errors: {
                404: 'Sugestão não encontrada',
                422: 'Transição ilegal: REJECTED → APPROVED',
            },
        });
    }

    /**
     * Rejeita uma sugestão PENDING (PENDING → REJECTED).
     * Re-rejeitar já-REJECTED é no-op. APPROVED → REJECTED lança 422.
     * @param id UUID da sugestão
     * @returns sugestão atualizada
     * @throws ApiError
     */
    public static rejeitar(id: string): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/sugestoes/{id}/rejeitar',
            path: { 'id': id },
            errors: {
                404: 'Sugestão não encontrada',
                422: 'Transição ilegal: APPROVED → REJECTED',
            },
        });
    }
}
