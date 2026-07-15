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
   * Conecta a conta intervals.icu do atleta autenticado (valida a API key antes de salvar).
   * @param apiKey API key gerada em intervals.icu -> Settings -> Developer
   * @returns IntervalsIcuConnectionStatus status da conexão recém-criada
   * @throws ApiError com `body.message` contendo a mensagem curada do backend (422 = key inválida)
   */
  public static connect(apiKey: string): CancelablePromise<IntervalsIcuConnectionStatus> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/integracoes/me/intervals-icu',
      body: { apiKey },
      mediaType: 'application/json',
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
