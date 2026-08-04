import { UserManager } from 'oidc-client-ts';
import { oidcSettings } from './oidcConfig';

/**
 * Instância única do `UserManager`.
 *
 * Precisa ser única porque o `UserManager` guarda o estado do fluxo (o `code_verifier` do PKCE, o
 * `state`) — duas instâncias trocariam mensagens entre si e o retorno do Keycloak falharia com um
 * erro que não parece o que é.
 *
 * Fica fora do React de propósito: `main.tsx` precisa dele antes do primeiro render para processar o
 * callback, e o `session` precisa dele para responder ao `OpenAPI.TOKEN`, que não vive num
 * componente.
 */
export const userManager = new UserManager(oidcSettings);

/** Chave do `state` onde viaja a rota de origem, para restaurar o destino após o callback. */
export const CHAVE_DESTINO = 'destino';

/** `true` quando a URL atual é o retorno do fluxo de autorização (traz `code` e `state`). */
export function ehRetornoDeAutorizacao(url: string = window.location.href): boolean {
  const params = new URL(url).searchParams;
  return params.has('code') && params.has('state');
}

/**
 * Remove `code`/`state` da barra de endereço depois de processar o retorno.
 *
 * Sem isso, um reload reenviaria o mesmo `code` — que o Keycloak já invalidou —, e o usuário veria
 * um erro de autorização sem ter feito nada.
 */
export function limparParametrosDeAutorizacao(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('session_state');
  url.searchParams.delete('iss');
  window.history.replaceState({}, document.title, url.toString());
}
