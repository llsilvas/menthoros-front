export type PerfilWaitlist = 'TREINADOR' | 'ATLETA';

export type FaixaAtletas = 'ATE_10' | 'DE_11_A_30' | 'DE_31_A_100' | 'MAIS_DE_100';

export interface WaitlistInput {
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilWaitlist;
  qtdAtletas?: FaixaAtletas;
  aceiteLgpd: boolean;
  /** Campo honeypot anti-spam — deve permanecer vazio. */
  website?: string;
}

export interface WaitlistResult {
  status: string;
  mensagem: string;
}
