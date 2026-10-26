import { ApiError } from '../core/ApiError';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface GarminConnectionStatus {
  ativo: boolean;
  /** userId Garmin mascarado — o backend nunca devolve o completo. */
  userId?: string;
  /** WORKOUT_IMPORT: atleta autorizou o envio de treinos ao relógio. */
  workoutImport: boolean;
  /** ACTIVITY_EXPORT: atleta autorizou a leitura das atividades. */
  activityExport: boolean;
  ultimaSincronizacao?: string;
  lastSyncError?: string;
}

export interface GarminAuthorizationUrl {
  authorizationUrl: string;
}

export class GarminConnectionService {
  /**
   * Status da conexão Garmin do atleta autenticado.
   * @returns GarminConnectionStatus status atual, ou `null` se o atleta nunca conectou (404)
   * @throws ApiError
   */
  public static async getStatus(): Promise<GarminConnectionStatus | null> {
    try {
      return await __request<GarminConnectionStatus>(OpenAPI, {
        method: 'GET',
        url: '/api/v1/integracoes/me/garmin',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * URL de consentimento OAuth2 do Garmin para o atleta autenticado. Conectar é redirecionar o
   * browser para ela; o retorno chega pelo callback do backend, que devolve o atleta a
   * `/#/athlete/profile?garmin=success|denied|error`.
   *
   * @returns URL completa de autorização, com `state` assinado
   * @throws ApiError 403 se o usuário não for ATLETA; 404 sem atleta vinculado; 503 com o canal
   *   desligado ou sem credenciais no ambiente
   */
  public static getAuthorizationUrl(): CancelablePromise<GarminAuthorizationUrl> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/integracoes/me/garmin/authorize-url',
    });
  }

  /**
   * Desconecta a conta Garmin do atleta autenticado (soft — o vínculo fica inativo).
   * @throws ApiError
   */
  public static disconnect(): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/integracoes/me/garmin',
    });
  }
}
