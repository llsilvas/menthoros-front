import type { UsuarioMeOutputDto } from '../../types/Usuario';
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
}
