import type { PerfilWaitlist } from "../types/Waitlist";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface AccessFormErrors {
  nome?: string;
  email?: string;
  perfil?: string;
  qtdAtletas?: string;
  aceiteLgpd?: string;
}

/**
 * Validação pura dos campos do formulário único de acesso (sem DOM/hook) — testável isoladamente.
 *
 * `aceiteLgpd` entra aqui (não como checagem solta no componente) para preservar a garantia
 * que o `disabled={!aceiteLgpd}` do botão dava de graça: nenhum caminho de submit passa sem
 * consentimento, porque a mesma função pura testada para os outros campos cobre esse também.
 *
 * "Quantos atletas" só é obrigatório para TREINADOR — um ATLETA não tem esse dado (FE-02 da spec
 * de conversão do Instagram, 2026-10-08).
 */
export function validate(
  nome: string,
  email: string,
  perfil: PerfilWaitlist | "",
  qtdAtletasRaw: string,
  aceiteLgpd: boolean,
): AccessFormErrors {
  const errors: AccessFormErrors = {};
  if (!nome.trim()) errors.nome = "Informe seu nome.";
  if (!EMAIL_RE.test(email)) errors.email = "Informe um email válido.";
  if (!perfil) errors.perfil = "Selecione uma opção.";
  if (perfil === "TREINADOR") {
    const n = Number(qtdAtletasRaw);
    if (!qtdAtletasRaw.trim() || !Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      errors.qtdAtletas = "Quantos atletas você acompanha hoje?";
    }
  }
  if (!aceiteLgpd) errors.aceiteLgpd = "É preciso aceitar para continuar.";
  return errors;
}
