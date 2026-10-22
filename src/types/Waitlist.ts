export type PerfilWaitlist = 'TREINADOR' | 'PROPRIETARIO' | 'ATLETA';

export type FaixaAtletas = 'ATE_10' | 'DE_11_A_30' | 'DE_31_A_100' | 'MAIS_DE_100';

/**
 * Marca de relógio predominante dos atletas — hoje só GARMIN está integrado, as demais só medem
 * demanda. `UNKNOWN` é valor de contrato (o enum do backend inclui), mas o formulário nunca o
 * envia: "Não sei" simplesmente omite `watchBrand` do payload (ver `AccessRequestForm.tsx`).
 */
export type WatchBrand = 'GARMIN' | 'COROS' | 'POLAR' | 'APPLE' | 'OTHER' | 'UNKNOWN';

/** Segmento derivado pelo backend a partir de perfil + watchBrand (nunca enviado, só lido na resposta). */
export type WaitlistSegment = 'ATLETA' | 'QUALIFIED' | 'OTHER_BRAND';

/** Perfis tratados como "treinador" — mesmo critério do backend (`PerfilWaitlist.isTreinadorOuProprietario`). */
export function isTreinadorOuProprietario(perfil: PerfilWaitlist | ''): boolean {
  return perfil === 'TREINADOR' || perfil === 'PROPRIETARIO';
}

export interface WaitlistInput {
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilWaitlist;
  qtdAtletas?: FaixaAtletas;
  /** Relógio predominante dos atletas (só relevante para treinador/proprietário, opcional). */
  watchBrand?: WatchBrand;
  aceiteLgpd: boolean;
  /** Campo honeypot anti-spam — deve permanecer vazio. */
  website?: string;
  /** Parâmetros UTM da URL de origem do signup (link da bio, campanhas) — opcionais. */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface WaitlistResult {
  status: string;
  mensagem: string;
  segment?: WaitlistSegment;
}
