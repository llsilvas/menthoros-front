import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../../types/Checkin';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Check-in diário de prontidão do atleta.
 * `registrarCheckin` é self-resolving (`atletaId` vem do JWT no backend, sem id no path).
 * `buscarAtual` não é self-resolving — recebe `atletaId` no path (o caller resolve via
 * `UsuarioService.getMe().atletaId`, mesmo padrão de `useAthletePlan.ts`).
 */
export class CheckinService {
  /**
   * Registra (ou atualiza, se já existir um para a mesma data) o check-in do dia.
   * @returns CheckinProntidaoOutput check-in registrado, com readinessScore/nivelProntidao calculados
   * @throws ApiError 400 (validação), 403 (não ATLETA)
   */
  public static registrarCheckin(input: CheckinProntidaoInput): CancelablePromise<CheckinProntidaoOutput> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/checkins',
      body: input,
      mediaType: 'application/json',
      errors: {
        400: 'Dados inválidos',
        403: 'Acesso negado',
      },
    });
  }

  /**
   * Busca o check-in mais recente do atleta (não necessariamente de hoje — o caller deve filtrar
   * por data, ver `useCheckinAtual`). Retorna `undefined` quando o atleta ainda não tem nenhum
   * check-in (204 No Content).
   * @throws ApiError 401, 403 (atleta tentando acessar checkin de outro), 404 (atleta não encontrado)
   */
  public static buscarAtual(atletaId: string): CancelablePromise<CheckinProntidaoOutput | undefined> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/checkins/{atletaId}/atual',
      path: { atletaId },
      errors: {
        403: 'Acesso negado',
        404: 'Atleta não encontrado',
      },
    });
  }
}
