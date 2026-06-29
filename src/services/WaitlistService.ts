import { OpenAPI } from '../api/core/OpenAPI';
import type { WaitlistInput, WaitlistResult } from '../types/Waitlist';

/** Erro de inscrição na waitlist, carregando o status HTTP para diferenciar o tratamento. */
export class WaitlistError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Waitlist request failed: ${status}`);
    this.name = 'WaitlistError';
    this.status = status;
  }
}

/**
 * Wrapper não-gerado do endpoint público `POST /api/v1/waitlist`.
 * Sem autenticação — cadastro pré-signup.
 */
export class WaitlistService {
  static async inscrever(payload: WaitlistInput): Promise<WaitlistResult> {
    const response = await fetch(`${OpenAPI.BASE}/api/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new WaitlistError(response.status);
    }

    return (await response.json()) as WaitlistResult;
  }
}
