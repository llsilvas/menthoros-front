import { ApiError } from '../core/ApiError';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface IntervalsIcuConnectionStatus {
  conectado: boolean;
  externalAthleteId?: string;
  conectadoEm?: string;
  ultimoPush?: string;
  ultimoErro?: string;
}

export interface IntervalsIcuAuthorizationUrl {
  authorizationUrl: string;
}

export class IntervalsIcuService {
  /**
   * Status da conexão intervals.icu do atleta autenticado.
   * @returns IntervalsIcuConnectionStatus status atual, ou `null` se o atleta nunca conectou (404)
   * @throws ApiError
   */
  public static async getStatus(): Promise<IntervalsIcuConnectionStatus | null> {
    try {
      return await __request<IntervalsIcuConnectionStatus>(OpenAPI, {
        method: 'GET',
        url: '/api/v1/integracoes/me/intervals-icu',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * URL de consentimento OAuth2 do intervals.icu para o atleta autenticado.
   *
   * O `POST` de conexão por API key **não existe mais** (o backend responde 405): o OAuth2
   * substituiu aquele fluxo e não convive com ele. Conectar agora é redirecionar o browser para
   * esta URL; o retorno chega pelo callback do backend, que devolve o atleta a
   * `/#/athlete/profile?intervals-icu=success|error`.
   *
   * @returns URL completa de autorização, com `state` assinado
   * @throws ApiError 403 se o usuário não for ATLETA; 404 se não houver atleta vinculado
   */
  public static getAuthorizationUrl(): CancelablePromise<IntervalsIcuAuthorizationUrl> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/integracoes/me/intervals-icu/authorize-url',
    });
  }

  /**
   * Desconecta a conta intervals.icu do atleta autenticado (soft — pushes futuros ficam inativos).
   * @throws ApiError
   */
  public static disconnect(): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/integracoes/me/intervals-icu',
    });
  }
}
