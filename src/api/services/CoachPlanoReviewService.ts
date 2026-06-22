import type { PlanoReviewStatus, PlanoSemanalDto, TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../types/PlanoReview';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Revisão de planos semanais gerados pela IA (`/api/v1/coach/planos`).
 * Restrito a TECNICO/ADMIN; o tenant é resolvido no backend via `TenantContext`.
 */
export class CoachPlanoReviewService {
    /**
     * Lista todos os planos do tenant com reviewStatus = AGUARDANDO_REVISAO.
     * Ordenados por semana de início (mais antigos primeiro).
     * @returns lista de planos pendentes de revisão
     * @throws ApiError
     */
    public static listarPendentes(): CancelablePromise<Array<PlanoSemanalDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/planos/pendentes',
        });
    }

    /**
     * Lista planos do tenant pelo status de revisão informado.
     * @param status AGUARDANDO_REVISAO | APROVADO | REJEITADO
     * @returns lista de planos com o status informado
     * @throws ApiError
     */
    public static listarPorStatus(status: PlanoReviewStatus): CancelablePromise<Array<PlanoSemanalDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/coach/planos/revisao',
            query: { status },
        });
    }

    /**
     * Aprova um plano AGUARDANDO_REVISAO (transiciona para APROVADO).
     * Lança 422 se o plano já estiver APROVADO ou REJEITADO.
     * @param id UUID do PlanoSemanal
     * @returns plano atualizado
     * @throws ApiError
     */
    public static aprovar(id: string): CancelablePromise<PlanoSemanalDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/planos/{id}/aprovar',
            path: { 'id': id },
            errors: {
                404: 'Plano não encontrado no tenant',
                422: 'Transição ilegal: plano não está AGUARDANDO_REVISAO',
            },
        });
    }

    /**
     * Rejeita um plano AGUARDANDO_REVISAO (transiciona para REJEITADO) com motivo obrigatório.
     * Lança 422 se o plano já estiver APROVADO ou REJEITADO.
     * @param id UUID do PlanoSemanal
     * @param motivo razão da rejeição (máx. 1000 caracteres)
     * @returns plano atualizado
     * @throws ApiError
     */
    public static rejeitar(id: string, motivo: string): CancelablePromise<PlanoSemanalDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/coach/planos/{id}/rejeitar',
            path: { 'id': id },
            body: { motivo },
            mediaType: 'application/json',
            errors: {
                400: 'Motivo ausente ou em branco',
                404: 'Plano não encontrado no tenant',
                422: 'Transição ilegal: plano não está AGUARDANDO_REVISAO',
            },
        });
    }

    /**
     * Edita um treino planejado durante revisão do plano (patch semântico — campos undefined ignorados).
     * Lança 422 se o plano não está AGUARDANDO_REVISAO; 409 em conflito concorrente.
     * @param planoId UUID do PlanoSemanal
     * @param treinoId UUID do TreinoPlanejado
     * @param patch campos editáveis (null/undefined = ignorar)
     * @returns treino atualizado
     * @throws ApiError
     */
    public static editarTreino(planoId: string, treinoId: string, patch: TreinoPlanejadoPatch): CancelablePromise<TreinoPlanejadoDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/coach/planos/{planoId}/treinos/{treinoId}',
            path: { planoId, treinoId },
            body: patch,
            mediaType: 'application/json',
            errors: {
                400: 'Campos inválidos',
                404: 'Plano ou treino não encontrado no tenant',
                409: 'Conflito de edição concorrente',
                422: 'Plano não está em revisão',
            },
        });
    }
}
