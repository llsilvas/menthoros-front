import { faixaDeAtletas } from "./athleteRange";
import { accessSuccess } from "./content";
import type { UtmParams } from "./parseUtm";
import {
  isTreinadorOuProprietario,
  type PerfilWaitlist,
  type WaitlistInput,
  type WaitlistSegment,
  type WatchBrand,
} from "../types/Waitlist";

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
 * "Quantos atletas" só é obrigatório para treinador/proprietário — um ATLETA não tem esse dado
 * (FE-02 da spec de conversão do Instagram, 2026-10-08).
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
  if (isTreinadorOuProprietario(perfil)) {
    const n = Number(qtdAtletasRaw);
    if (!qtdAtletasRaw.trim() || !Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      errors.qtdAtletas = "Quantos atletas você acompanha hoje?";
    }
  }
  if (!aceiteLgpd) errors.aceiteLgpd = "É preciso aceitar para continuar.";
  return errors;
}

export interface AccessFormValues {
  nome: string;
  email: string;
  telefone: string;
  perfil: PerfilWaitlist | "";
  qtdAtletasRaw: string;
  watchBrand: WatchBrand | "";
  aceiteLgpd: boolean;
  /** Campo honeypot anti-spam. */
  website: string;
}

/**
 * Monta o payload de `POST /api/v1/waitlist` a partir dos valores do formulário — função pura
 * (sem DOM/hook), testável isoladamente, mesmo padrão de `validate` acima. `utm` entra como
 * parâmetro porque sua leitura (`sessionStorage`) é side-effecting; quem chama resolve antes.
 */
export function buildWaitlistPayload(values: AccessFormValues, utm: Partial<UtmParams>): WaitlistInput {
  const { nome, email, telefone, perfil, qtdAtletasRaw, watchBrand, aceiteLgpd, website } = values;
  const ehTreinadorOuProprietario = isTreinadorOuProprietario(perfil);
  return {
    nome: nome.trim(),
    email: email.trim(),
    telefone: telefone.trim() || undefined,
    perfil: perfil as PerfilWaitlist,
    qtdAtletas: ehTreinadorOuProprietario ? faixaDeAtletas(Number(qtdAtletasRaw)) : undefined,
    watchBrand: ehTreinadorOuProprietario && watchBrand ? watchBrand : undefined,
    aceiteLgpd,
    website: website || undefined,
    ...utm,
  };
}

/**
 * Decide a variante de `accessSuccess` (FE-05) para a tela de sucesso. `segment` é a fonte de
 * verdade — vem derivado do backend na resposta da inscrição; `perfilEnviado` só decide no
 * fallback (resposta sem `segment`, ex.: contrato antigo/erro), nunca junto com `segment`.
 */
export function resolveSuccessContent(perfilEnviado: PerfilWaitlist, segment: WaitlistSegment | undefined) {
  if (segment) {
    if (segment === "ATLETA") return accessSuccess.atleta;
    if (segment === "OTHER_BRAND") return accessSuccess.outraMarca;
    return accessSuccess.treinador;
  }
  return perfilEnviado === "ATLETA" ? accessSuccess.atleta : accessSuccess.treinador;
}
