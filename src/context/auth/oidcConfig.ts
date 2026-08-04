import { InMemoryWebStorage, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';
import { runtimeConfig } from '../../config/env';

/**
 * Configuração do fluxo Authorization Code + PKCE contra o Keycloak.
 *
 * Ver `migrate-login-to-authorization-code-pkce` — as decisões abaixo não são default da biblioteca
 * e cada uma corresponde a um risco verificado no ambiente real.
 */

/** `http://host/realms/menthoros` — o issuer, de onde a lib descobre os endpoints. */
export const authority = `${runtimeConfig.keycloakUrl}/realms/${runtimeConfig.keycloakRealm}`;

/**
 * O retorno do fluxo aponta para a raiz da aplicação, não para uma rota `#/callback`.
 *
 * O app usa `createHashRouter`: o `code` volta na query string enquanto o roteador vive no
 * fragmento. Uma rota de callback dentro do hash é a parte frágil desse arranjo — a raiz é servida
 * pelo servidor estático e já está registrada nos `redirectUris` do client (todos com wildcard).
 */
const redirectUri = `${window.location.origin}/`;

export const oidcSettings: UserManagerSettings = {
  authority,
  client_id: runtimeConfig.keycloakClientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: redirectUri,

  // Authorization Code; a biblioteca aplica PKCE S256 por padrão neste fluxo.
  response_type: 'code',

  /**
   * `organization` é **optional client scope** no `menthoros-web` — não vem por padrão. Sem ele o
   * JWT sai sem `tenant_id`, o `JwtTenantFilter` rejeita toda requisição autenticada e o app inteiro
   * responde 403 **com o login concluindo normalmente**. É o modo de falha mais barato de introduzir
   * e o mais caro de diagnosticar, por isso está explícito aqui e coberto por teste.
   */
  scope: 'openid profile email organization',

  /**
   * Token só em memória: nada que um XSS consiga ler de `localStorage`. O preço é que uma aba nova
   * não herda a sessão sem falar com o Keycloak.
   */
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),

  /**
   * Renovação por **redirect**, não por iframe.
   *
   * Todos os ambientes são cross-site (em produção, `menthoros.com` contra Keycloak em
   * `*.up.railway.app`), então o cookie de sessão do Keycloak é third-party dentro de um iframe —
   * bloqueado por padrão em Safari e Firefox. O silent renew falharia **em silêncio**, jogando o
   * usuário no login sem motivo aparente: o pior modo de falha possível aqui.
   */
  automaticSilentRenew: false,

  /** Avisa antes de expirar, para renovar com folga em vez de reagir a um 401 no meio de uma ação. */
  accessTokenExpiringNotificationTimeInSeconds: 60,

  /** O `state` do fluxo carrega o destino original — ver `session.ts`. */
  monitorSession: false,
};
