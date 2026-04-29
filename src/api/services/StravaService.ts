import type { SyncStatus, SyncResponse, StravaAuthorizationUrlResponse } from '../../types/Strava';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class StravaService {
  /**
   * Retorna URL de autorização OAuth2 do Strava
   * @param atletaId ID do atleta
   * @returns StravaAuthorizationUrlResponse URL de autorização
   * @throws ApiError
   */
  public static getAuthorizationUrl(
    atletaId: string,
  ): CancelablePromise<StravaAuthorizationUrlResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/strava/auth/url/{atletaId}',
      path: {
        'atletaId': atletaId,
      },
    });
  }

  /**
   * Dispara sincronização manual de atividades do atleta
   * @param atletaId ID do atleta
   * @returns SyncResponse Resultado da sincronização
   * @throws ApiError
   */
  public static triggerSync(
    atletaId: string,
  ): CancelablePromise<SyncResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/strava/sync/{atletaId}',
      path: {
        'atletaId': atletaId,
      },
      errors: {
        409: 'Sincronização já em progresso',
        429: 'Limite de requisições Strava atingido',
        500: 'Erro ao sincronizar',
      },
    });
  }

  /**
   * Retorna status da última/atual sincronização
   * @param atletaId ID do atleta
   * @returns SyncStatus Status atual da sincronização
   * @throws ApiError
   */
  public static getSyncStatus(
    atletaId: string,
  ): CancelablePromise<SyncStatus> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/strava/sync-status/{atletaId}',
      path: {
        'atletaId': atletaId,
      },
      errors: {
        404: 'Integração Strava não encontrada',
      },
    });
  }
}
