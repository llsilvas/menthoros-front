/** Estado do consentimento do atleta para o trajeto GPS aparecer nos cards de compartilhamento. */
export interface TrajetoShareConsentDto {
  /** Verdadeiro só se o último evento for concessão na versão vigente da Política. */
  granted: boolean;
  /** Versão vigente da Política (`YYYY-MM-DD`). */
  policyVersion: string;
  /** Momento do último evento; ausente se o atleta nunca respondeu. */
  registradoEm?: string | null;
}
