import type { ConsentInputDto, UsuarioMeOutputDto } from '../../types/Usuario';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Serviço de identidade do usuário autenticado (`/api/v1/users/me`).
 * Requer autenticação (JWT); retorna os dados do usuário atual e sua assessoria.
 */
export class UsuarioService {
    /**
     * Dados do usuário autenticado: nome, email, role e assessoria.
     * @returns UsuarioMeOutputDto identidade do usuário atual
     * @throws ApiError
     */
    public static getMe(): CancelablePromise<UsuarioMeOutputDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me',
        });
    }

    /**
     * Registra o aceite dos Termos de Uso e da Política de Privacidade.
     *
     * Idempotente: reenviar o mesmo aceite não cria segundo registro.
     *
     * @throws ApiError `409` com `code: 'CONSENT_VERSION_STALE'` quando as versões enviadas não são
     *   mais as vigentes — o cliente deve recarregar `getMe()` e reapresentar o texto atualizado.
     */
    public static registrarConsentimento(input: ConsentInputDto): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/consent',
            body: input,
            mediaType: 'application/json',
        });
    }
}
