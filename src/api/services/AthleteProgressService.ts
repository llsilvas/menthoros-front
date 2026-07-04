import type {
  AthleteAderencia,
  AthletePmc,
  AthleteRecord,
  AthleteZones,
} from '../../types/AthleteProgress';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Progresso do atleta autenticado (`/api/v1/atletas/me/**`). Restrito a ATLETA;
 * o atleta é resolvido no backend via JWT (`resolverAtletaIdAtual()`), não recebe id no path.
 * Espelha os endpoints `/{id}/**` já consumidos pelo perfil do atleta visto pelo coach.
 */
export class AthleteProgressService {
  /**
   * Série diária CTL/ATL/TSB/TSS no intervalo (default: últimos 90 dias).
   * @returns AthletePmc[] histórico PMC
   * @throws ApiError
   */
  public static getPmcHistorico(from?: string, to?: string): CancelablePromise<AthletePmc[]> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/atletas/me/metricas/historico',
      query: { from, to },
    });
  }

  /**
   * Distribuição de tempo por zona de FC (z1–z5) no intervalo (default: últimos 90 dias).
   * @returns AthleteZones distribuição de zonas
   * @throws ApiError
   */
  public static getZonas(from?: string, to?: string): CancelablePromise<AthleteZones> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/atletas/me/metricas/zonas',
      query: { from, to },
    });
  }

  /**
   * Recordes pessoais (5k/10k/21k) derivados dos treinos realizados.
   * @returns AthleteRecord[] recordes (lista vazia quando o atleta ainda não tem PRs)
   * @throws ApiError
   */
  public static getRecordes(): CancelablePromise<AthleteRecord[]> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/atletas/me/recordes',
    });
  }

  /**
   * Aderência semanal ao plano nas últimas `semanas` semanas (default 4).
   * @returns AthleteAderencia[] aderência por semana
   * @throws ApiError
   */
  public static getAderencia(semanas?: number): CancelablePromise<AthleteAderencia[]> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/atletas/me/aderencia',
      query: { semanas },
    });
  }
}
