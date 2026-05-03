import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type {
  PendentesPage,
  CandidateMatch,
  ReconciliacaoAcaoRequest,
} from '../../types/Reconciliacao';

export class ReconciliacaoService {
  static listarPendentes(
    atletaId: string,
    params: {
      statuses?: string[];
      dataInicio?: string;
      dataFim?: string;
      page?: number;
      size?: number;
    } = {}
  ): CancelablePromise<PendentesPage> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/reconciliation/atletas/{atletaId}/pendentes',
      path: { atletaId },
      query: { ...params, size: params.size ?? 20 },
    });
  }

  static listarCandidatos(treinoRealizadoId: string): CancelablePromise<CandidateMatch[]> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/reconciliation/{treinoRealizadoId}/candidatos',
      path: { treinoRealizadoId },
    });
  }

  static executarAcao(
    treinoRealizadoId: string,
    body: ReconciliacaoAcaoRequest
  ): CancelablePromise<unknown> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/reconciliation/{treinoRealizadoId}/acao',
      path: { treinoRealizadoId },
      body,
      mediaType: 'application/json',
    });
  }
}
