/** Dados públicos de um convite de atleta ativo (lookup por token). */
export interface AthleteInviteLookup {
  nomeAtleta: string;
  assessoria: string;
  emailSugerido: string;
}

/** Aceite do convite: cria a conta e vincula ao atleta do convite. */
export interface AthleteInviteAcceptInput {
  token: string;
  nome: string;
  senha: string;
  /** Ausente, vale o e-mail do convite; diferente, a conta nasce com verificação pendente. */
  email?: string;
}
