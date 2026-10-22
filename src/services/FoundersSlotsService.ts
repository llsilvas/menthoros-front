import { OpenAPI } from '../api/core/OpenAPI';
import type { FoundersSlots } from '../types/FoundersSlots';

/** Erro de consulta das vagas da turma fundadora, carregando o status HTTP. */
export class FoundersSlotsError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Founders slots request failed: ${status}`);
    this.name = 'FoundersSlotsError';
    this.status = status;
  }
}

/**
 * Wrapper não-gerado do endpoint público `GET /api/v1/founders/slots`.
 * Sem autenticação — mesmo padrão de `WaitlistService.ts`.
 */
export class FoundersSlotsService {
  static async obterVagas(): Promise<FoundersSlots> {
    const response = await fetch(`${OpenAPI.BASE}/api/v1/founders/slots`);

    if (!response.ok) {
      throw new FoundersSlotsError(response.status);
    }

    return (await response.json()) as FoundersSlots;
  }
}
