import type { KudosInput, KudosOutput, KudosRecente } from '../../types/Kudos';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Kudos (reconhecimento) do coach para o atleta.
 * `registrarKudo` é ação do coach (`atletaId` no path). `buscarRecentes` é self-resolving
 * (ATLETA, `atletaId` vem do JWT no backend).
 */
export class KudosService {
  /**
   * Registra um kudo do coach autenticado para o atleta.
   * @returns KudosOutput kudo criado
   * @throws ApiError 400 (motivo inválido), 403 (atleta de outro tenant), 404 (atleta não encontrado),
   * 409 (kudo do mesmo motivo já registrado hoje para este atleta)
   */
  public static registrarKudo(atletaId: string, input: KudosInput): CancelablePromise<KudosOutput> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/coach/atletas/{atletaId}/kudos',
      path: { atletaId },
      body: input,
      mediaType: 'application/json',
      errors: {
        400: 'Dados inválidos',
        403: 'Acesso negado',
        404: 'Atleta não encontrado',
        409: 'Kudo já registrado hoje para este atleta e motivo',
      },
    });
  }

  /**
   * Últimos kudos recebidos pelo atleta autenticado (até 10, mais recente primeiro).
   * @returns KudosRecente[] lista vazia quando não há nenhum kudo
   */
  public static buscarRecentes(): CancelablePromise<KudosRecente[]> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/atletas/me/kudos/recentes',
      errors: {
        404: 'Atleta não encontrado',
      },
    });
  }
}
