const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface AccessFormErrors {
  nome?: string;
  email?: string;
  qtdAtletas?: string;
}

/** Validação pura dos campos do form de acesso (sem DOM/hook) — testável isoladamente. */
export function validate(nome: string, email: string, qtdAtletasRaw: string): AccessFormErrors {
  const errors: AccessFormErrors = {};
  if (!nome.trim()) errors.nome = "Informe seu nome.";
  if (!EMAIL_RE.test(email)) errors.email = "Informe um email válido.";
  const n = Number(qtdAtletasRaw);
  if (!qtdAtletasRaw.trim() || !Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    errors.qtdAtletas = "Quantos atletas você acompanha hoje?";
  }
  return errors;
}
