export interface CoachSignupInput {
  nome: string;
  email: string;
  senha: string;
  nomeAssessoria: string;
  slug: string;
  /** Honeypot anti-spam — deve chegar vazio. */
  website?: string;
}

export interface CoachSignupResult {
  slug: string;
  email: string;
  proximoPasso: string;
}
