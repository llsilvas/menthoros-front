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
     * Detalha uma sugestão pelo id.
     * @param id UUID da sugestão
     * @returns sugestão completa
     * @throws ApiError
     */
    public static detalhe(id: string): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/sugestoes/{id}',
            path: { 'id': id },
            errors: {
                404: 'Sugestão não encontrada',
            },
        });
    }

    /**
     * Aprova uma sugestão PENDING (PENDING → APPROVED).
     * Re-aprovar já-APPROVED é no-op. REJECTED → APPROVED lança 422.
     * @param id UUID da sugestão
     * @param versaoEsperada `versao` lida pelo cliente; 409 se a sugestão mudou desde então
     * @returns sugestão atualizada
     * @throws ApiError
     */
    public static aprovar(id: string, versaoEsperada?: number): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/sugestoes/{id}/aprovar',
            path: { 'id': id },
            query: { 'versaoEsperada': versaoEsperada },
            errors: {
                404: 'Sugestão não encontrada',
                409: 'Outra decisão concorrente já transicionou a sugestão, ou a versão lida está desatualizada',
                422: 'Transição ilegal: REJECTED → APPROVED',
            },
        });
    }

    /**
     * Rejeita uma sugestão PENDING (PENDING → REJECTED). `rejectionReason` é opcional.
     * Re-rejeitar já-REJECTED é no-op. APPROVED → REJECTED lança 422.
     * @param id UUID da sugestão
     * @param rejectionReason motivo opcional da rejeição (máx. 500 caracteres)
     * @param versaoEsperada `versao` lida pelo cliente; 409 se a sugestão mudou desde então
     * @returns sugestão atualizada
     * @throws ApiError
     */
    public static rejeitar(id: string, rejectionReason?: string, versaoEsperada?: number): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/sugestoes/{id}/rejeitar',
            path: { 'id': id },
            query: { 'versaoEsperada': versaoEsperada },
            body: rejectionReason ? { rejectionReason } : undefined,
            mediaType: 'application/json',
            errors: {
                404: 'Sugestão não encontrada',
                409: 'Outra decisão concorrente já transicionou a sugestão, ou a versão lida está desatualizada',
                422: 'Transição ilegal: APPROVED → REJECTED',
            },
        });
    }

    /**
     * Edita o `summary` de uma sugestão PENDING. A primeira edição preserva o texto da IA em
     * `summaryOriginal`. Só `summary` é editável.
     * @param id UUID da sugestão
     * @param summary novo texto (máx. 500 caracteres)
     * @param versaoEsperada `versao` lida pelo cliente (obrigatória); 409 se a sugestão mudou desde então
     * @returns sugestão atualizada
     * @throws ApiError
     */
    public static editar(id: string, summary: string, versaoEsperada: number): CancelablePromise<SugestaoCoachOutputDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/coach/sugestoes/{id}',
            path: { 'id': id },
            body: { summary, versaoEsperada },
            mediaType: 'application/json',
            errors: {
                400: 'summary vazio, acima de 500 caracteres ou versaoEsperada ausente',
                404: 'Sugestão não encontrada',
                409: 'A sugestão mudou desde que foi lida',
                422: 'Sugestão não está PENDING',
            },
        });
    }
}
