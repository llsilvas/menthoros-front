export interface CoachSignupInput {
  nome: string;
  email: string;
  senha: string;
  nomeAssessoria: string;
  slug: string;
  /** Honeypot anti-spam — deve chegar vazio. */
  website?: string;
  /**
   * Token do convite de assessoria fundadora, quando o cadastro vem do link do e-mail. Com ele o
   * backend aceita o cadastro mesmo com o auto-cadastro público desligado.
   */
  inviteToken?: string;
}

export interface CoachSignupResult {
  slug: string;
  email: string;
  proximoPasso: string;
}

/** O que `GET /api/public/founding-invites/{token}` devolve para um convite ativo. */
export interface FoundingInviteLookup {
  nome: string;
  email: string;
}
