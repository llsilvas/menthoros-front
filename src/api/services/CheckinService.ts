import type { CheckinProntidaoInput, CheckinProntidaoOutput } from '../../types/Checkin';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Check-in diário de prontidão do atleta autenticado. `atletaId` é resolvido no backend via JWT
 * (`resolverAtletaIdAtual()`); o registro não recebe id no path.
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
}
