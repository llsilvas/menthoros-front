import { parseUtmParams, type UtmParams } from './parseUtm';

const STORAGE_KEY = 'menthoros:utm';

/**
 * A query de uma rota de hash (`#/waitlist?utm_source=x`) vive DENTRO do fragmento —
 * `window.location.search` só enxerga o que vem antes do `#`. `deepLinkRedirect.ts` já normaliza
 * o link de bio para deixar a UTM no `search`, mas uma navegação interna com hash+query (ou um
 * link copiado manualmente) ainda pode trazer a UTM só no fragmento, então lemos os dois lugares.
 */
function readFragmentSearch(): string {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  return queryIndex === -1 ? '' : hash.slice(queryIndex);
}

function hasAnyUtm(params: Partial<UtmParams>): boolean {
  return Boolean(params.utmSource || params.utmMedium || params.utmCampaign || params.utmContent);
}

function readUtmFromCurrentUrl(): Partial<UtmParams> {
  const fromFragment = parseUtmParams(readFragmentSearch());
  const fromPath = parseUtmParams(window.location.search);
  // A query de PATH (antes do `#`) tem prioridade: é o formato que `deepLinkRedirect.ts` produz
  // para o link de bio, o caso que mais importa rastrear corretamente.
  return { ...fromFragment, ...fromPath };
}

/**
 * Captura a UTM da URL atual e persiste em `sessionStorage` na PRIMEIRA carga da sessão que trouxer
 * algum valor — chamadas seguintes não sobrescrevem. Isso é o que falta hoje: a UTM só era lida no
 * instante do submit, então navegar de `/` (com UTM) para `/waitlist` (sem UTM na URL) a perdia.
 * Chamar uma vez no bootstrap do app, depois do redirect de deep link (`deepLinkRedirect.ts`).
 */
export function captureAndPersistUtm(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return; // já capturada nesta sessão — não sobrescreve
    const utm = readUtmFromCurrentUrl();
    if (hasAnyUtm(utm)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
    }
  } catch {
    // sessionStorage indisponível (modo privado, cookies bloqueados): segue sem persistência —
    // o formulário ainda funciona, só perde a sobrevivência entre páginas.
  }
}

/**
 * UTM para o payload de envio do formulário: a capturada na sessão tem prioridade; se não houver
 * nada persistido (sessionStorage bloqueado, ou a captura de bootstrap não rodou), cai de volta
 * para ler a URL atual — nunca inventa valor.
 */
export function getUtmForSubmission(): Partial<UtmParams> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Partial<UtmParams>;
  } catch {
    // ignora e cai no fallback de URL
  }
  return readUtmFromCurrentUrl();
}
