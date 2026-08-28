import { OpenAPI } from '../api/core/OpenAPI';
import type { CoachSignupInput, CoachSignupResult, FoundingInviteLookup } from '../types/CoachSignup';

/** Erro do auto-cadastro, carregando o status HTTP para diferenciar o tratamento. */
export class CoachSignupError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Coach signup request failed: ${status}`);
    this.name = 'CoachSignupError';
    this.status = status;
  }
}

/**
 * Wrapper não-gerado dos endpoints públicos do cadastro de assessoria.
 *
 * Sem autenticação, e sem `Authorization` de propósito: o cadastro roda antes de existir sessão.
 * A resposta **não** traz token — quem autentica é o Keycloak, pelo fluxo PKCE já existente.
 */
export class CoachSignupService {
  static async cadastrar(
    payload: CoachSignupInput,
    idempotencyKey: string,
  ): Promise<CoachSignupResult> {
    const response = await fetch(`${OpenAPI.BASE}/api/public/coach-signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Amarra o reenvio ao resultado original. É o que impede o duplo clique de criar
        // duas assessorias — a chave tem de ser a MESMA entre as tentativas, por isso ela
        // nasce no hook (por tentativa do usuário) e não aqui (por requisição).
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new CoachSignupError(response.status);
    }

    return (await response.json()) as CoachSignupResult;
  }

  /**
   * Dados do inscrito para um convite de fundadora ativo. Qualquer convite que não esteja ativo
   * (inexistente, expirado, invalidado, convertido) responde 404 — o backend não distingue.
   */
  static async consultarConvite(token: string): Promise<FoundingInviteLookup> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/public/founding-invites/${encodeURIComponent(token)}`,
    );

    if (!response.ok) {
      throw new CoachSignupError(response.status);
    }

    return (await response.json()) as FoundingInviteLookup;
  }
}
