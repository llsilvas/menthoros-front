const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface AccessFormErrors {
  nome?: string;
  email?: string;
  qtdAtletas?: string;
  aceiteLgpd?: string;
}

/**
 * Validação pura dos campos do form de acesso (sem DOM/hook) — testável isoladamente.
 *
 * `aceiteLgpd` entra aqui (não como checagem solta no componente) para preservar a garantia
 * que o `disabled={!aceiteLgpd}` do botão dava de graça: nenhum caminho de submit passa sem
 * consentimento, porque a mesma função pura testada para os outros campos cobre esse também.
 */
export function validate(nome: string, email: string, qtdAtletasRaw: string, aceiteLgpd: boolean): AccessFormErrors {
  const errors: AccessFormErrors = {};
  if (!nome.trim()) errors.nome = "Informe seu nome.";
  if (!EMAIL_RE.test(email)) errors.email = "Informe um email válido.";
  const n = Number(qtdAtletasRaw);
  if (!qtdAtletasRaw.trim() || !Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    errors.qtdAtletas = "Quantos atletas você acompanha hoje?";
  }
  if (!aceiteLgpd) errors.aceiteLgpd = "É preciso aceitar para continuar.";
  return errors;
}
