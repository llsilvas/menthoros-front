import type { WaitlistInput } from '../types/Waitlist';

const UTM_MAX_LENGTH = 255;

/** Só os 4 campos UTM de `WaitlistInput` — não duplica a forma, reaproveita o tipo do contrato. */
export type UtmParams = Pick<WaitlistInput, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent'>;

const UTM_KEYS: { param: string; field: keyof UtmParams }[] = [
  { param: 'utm_source', field: 'utmSource' },
  { param: 'utm_medium', field: 'utmMedium' },
  { param: 'utm_campaign', field: 'utmCampaign' },
  { param: 'utm_content', field: 'utmContent' },
];

/**
 * Lê os 4 parâmetros UTM padrão de uma query string, truncando cada valor em 255 caracteres —
 * o mesmo limite do `@Size(max = 255)` do backend (`WaitlistInputDto`). Nunca descarta o campo
 * nem impede o envio: um `utm_content` de mídia paga acima de 255 caracteres é comum, e sem esse
 * truncamento a inscrição inteira seria rejeitada com 400 por causa de um parâmetro opcional de
 * rastreamento (achado do Codex adversarial review, CA6 em `proposal.md`).
 *
 * Recebe `search` explicitamente (não lê `window.location` aqui) para permanecer uma função pura,
 * testável sem DOM — quem chama passa `window.location.search`.
 */
export function parseUtmParams(search: string): Partial<UtmParams> {
  const params = new URLSearchParams(search);
  const result: Partial<UtmParams> = {};

  for (const { param, field } of UTM_KEYS) {
    const valor = params.get(param);
    if (valor) {
      result[field] = valor.slice(0, UTM_MAX_LENGTH);
    }
  }

  return result;
}
