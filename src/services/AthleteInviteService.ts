import { OpenAPI } from '../api/core/OpenAPI';
import type { AthleteInviteAcceptInput, AthleteInviteLookup } from '../types/AthleteInvite';

/** Erro do convite de atleta, carregando o status HTTP para diferenciar o tratamento. */
export class AthleteInviteError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Athlete invite request failed: ${status}`);
    this.name = 'AthleteInviteError';
    this.status = status;
  }
}

/**
 * Wrapper não-gerado dos endpoints públicos do convite de atleta (mesmo padrão do
 * `CoachSignupService`): sem `Authorization` de propósito — o aceite roda antes de existir
 * sessão, e é ele que cria a conta. Quem autentica depois é o Keycloak, pelo PKCE existente.
 */
export class AthleteInviteService {
  /**
   * Dados do convite para a página de cadastro. Qualquer convite que não esteja ativo
   * (inexistente, expirado, invalidado, aceito) responde 404 — o backend não distingue.
   */
  static async consultarConvite(token: string): Promise<AthleteInviteLookup> {
    const response = await fetch(
      `${OpenAPI.BASE}/api/public/athlete-invites/${encodeURIComponent(token)}`,
    );

    if (!response.ok) {
      throw new AthleteInviteError(response.status);
    }

    return (await response.json()) as AthleteInviteLookup;
  }

  /**
   * Aceita o convite: o backend cria a conta no Keycloak (role ATLETA + Organization do tenant do
   * convite) e vincula ao atleta — 201 sem corpo. 409: e-mail já tem conta ou atleta já vinculado;
   * 410: convite consumido/expirado (inclusive o segundo clique de um duplo submit).
   */
  static async aceitar(payload: AthleteInviteAcceptInput): Promise<void> {
    const response = await fetch(`${OpenAPI.BASE}/api/public/athlete-invites/aceitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new AthleteInviteError(response.status);
    }
  }
}
