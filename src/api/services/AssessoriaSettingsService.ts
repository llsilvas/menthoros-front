import type { AssessoriaMe, AssessoriaPatch } from '../../types/AssessoriaSettings';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Configuração da assessoria pelo próprio coach.
 *
 * Leitura é aberta a qualquer técnico do tenant; escrita exige a role `PROPRIETARIO` (o dono da
 * assessoria). Toda escrita ecoa a `version` lida no GET — versão obsoleta devolve 409 em vez de
 * sobrescrever o que outra aba salvou.
 *
 * O wizard de primeiro login (`coach-first-login-wizard`) reutiliza estes métodos; mudanças aqui
 * afetam aquela change.
 */
export class AssessoriaSettingsService {
    /**
     * Identidade, plano, uso e versão da assessoria do usuário autenticado.
     * @throws ApiError 403 (sem tenant ou role insuficiente), 404 (tenant sem assessoria)
     */
    public static buscarMinhaAssessoria(): CancelablePromise<AssessoriaMe> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessorias/me',
            errors: {
                403: 'Acesso negado',
                404: 'Assessoria não encontrada',
            },
        });
    }

    /**
     * Atualiza os campos editáveis. Enviar chave fora de {@link AssessoriaPatch} devolve 400.
     * @throws ApiError 400 (payload inválido ou campo não editável), 403 (não é o dono),
     *         409 (versão obsoleta)
     */
    public static atualizar(body: AssessoriaPatch): CancelablePromise<AssessoriaMe> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/assessorias/me',
            body,
            mediaType: 'application/json',
            errors: {
                400: 'Dados inválidos',
                403: 'Apenas o dono da assessoria pode editar',
                409: 'A assessoria foi alterada em outra sessão',
            },
        });
    }

    /**
     * Envia ou substitui a logo. O backend decodifica a imagem para validar — extensão e
     * `Content-Type` do cliente não são considerados.
     * @throws ApiError 403 (não é o dono), 409 (versão obsoleta), 413 (acima do limite do servidor),
     *         422 (não é imagem aceita, ou excede tamanho/dimensões)
     */
    public static enviarLogo(arquivo: File, version: number): CancelablePromise<AssessoriaMe> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/assessorias/me/logo',
            query: { version },
            formData: { arquivo },
            errors: {
                403: 'Apenas o dono da assessoria pode enviar a logo',
                409: 'A assessoria foi alterada em outra sessão',
                413: 'Arquivo grande demais',
                422: 'Arquivo não é uma imagem válida',
            },
        });
    }

    /**
     * Remove a logo. Exige `version` pelo mesmo motivo do PATCH: sem ela, uma aba antiga apagaria
     * a imagem que outra acabou de enviar.
     * @throws ApiError 403 (não é o dono), 409 (versão obsoleta)
     */
    public static removerLogo(version: number): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/assessorias/me/logo',
            query: { version },
            errors: {
                403: 'Apenas o dono da assessoria pode remover a logo',
                409: 'A assessoria foi alterada em outra sessão',
            },
        });
    }
}
