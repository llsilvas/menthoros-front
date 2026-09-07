/**
 * Converte um deep link de PATH (`/waitlist?utm=…`) na rota de HASH equivalente
 * (`/?utm=…#/waitlist`), preservando a query, ANTES de o hash router montar.
 *
 * Por quê: o app usa `createHashRouter`, então a rota real vive no fragmento. Um link de bio com
 * o fragmento (`…#/waitlist`) não sobrevive: o wrapper de link do Instagram re-encoda a URL e o
 * `#` deixa de ser delimitador (vira `%23` dentro do `utm_campaign`), e o apex `menthoros.com`
 * faz 301 para `app.menthoros.com` descartando o fragmento. Um link de PATH limpo
 * (`app.menthoros.com/waitlist?utm=…`) é imune aos dois — o nginx serve o SPA e este bootstrap o
 * traduz para a rota de hash, mantendo a UTM no `search` (onde `parseUtmParams` a lê).
 *
 * Paliativo até a migração para browser router (radar_browser_router), que elimina a tradução.
 */

/** Rotas públicas que podem chegar como PATH por um link externo. Só estas são traduzidas. */
const PATHS_PUBLICOS = new Set(['/waitlist', '/cadastro', '/privacidade', '/termos']);

/**
 * Idempotente e seguro: só age quando o pathname é exatamente uma rota pública conhecida (hoje
 * essas URLs já caem na landing por falta de hash) e ainda não há fragmento. Chamar com hash
 * presente, na raiz, ou em path desconhecido é no-op.
 *
 * @returns true se redirecionou (o chamador deve abortar o boot — a página vai recarregar).
 */
export function redirectPathDeepLink(loc: Location = window.location): boolean {
  if (loc.hash) {
    return false; // já é rota de hash — nada a fazer
  }
  if (!PATHS_PUBLICOS.has(loc.pathname)) {
    return false; // raiz ou path desconhecido: deixa o SPA seguir normalmente
  }
  // /waitlist?utm=x  ->  /?utm=x#/waitlist  (query preservada no search; path vira fragmento)
  const destino = `${loc.origin}/${loc.search}#${loc.pathname}`;
  loc.replace(destino);
  return true;
}
