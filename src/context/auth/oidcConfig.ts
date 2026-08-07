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
   * **`stateStore` é outra coisa e precisa persistir.** Ele guarda o `code_verifier` do PKCE e o
   * `state` durante o redirect — e o redirect recarrega a página, então memória não serve: sem isso
   * a troca do `code` por token falha em 100% dos logins.
   *
   * Fica em `sessionStorage`, não no `localStorage` que a biblioteca usa por padrão: o dado é
   * efêmero e vale por aba. O `localStorage` sobreviveria ao fechamento do navegador e deixaria
   * resíduo de fluxos abandonados. **Nenhum token é guardado aqui** — o critério de aceite da change
   * ("`localStorage` sem access token nem refresh token") continua valendo.
   */
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),

  /**
   * Renovação **silenciosa por refresh token**. São três mecanismos possíveis, e só um serve aqui:
   *
   * | Mecanismo | Como renova | Cross-site |
   * |---|---|---|
   * | redirect | navega até o IdP e volta | funciona — e **recarrega a página inteira** |
   * | iframe (`prompt=none`) | iframe oculto, apoiado no cookie de sessão do Keycloak | **quebra** — cookie third-party |
   * | refresh token | `POST /token` com `grant_type=refresh_token` | **funciona** — não usa cookie |
   *
   * A versão anterior desta config usava **redirect**, com a justificativa de que o iframe quebraria
   * cross-site (`menthoros.com` contra Keycloak em `*.up.railway.app`). A parte sobre o iframe está
   * certa; o erro foi concluir dali que *nenhuma* renovação silenciosa serve. O preço foi a página
   * recarregando a cada ~4 minutos, no meio do trabalho do treinador.
   *
   * `signinSilent()` usa o refresh token quando existe e **só cai no iframe quando não existe**. Um
   * POST com token no corpo não é afetado por ITP nem pelo bloqueio de cookies de terceiros.
   *
   * ⚠️ **Não configurar `silent_redirect_uri`.** Sem refresh token em memória — toda aba nova, todo
   * reload — a lib tentaria o iframe; sem essa URL ela falha explicitamente, e a falha vira
   * `silentRenewError`, tratado no `AuthProvider`. Falhar alto é melhor que um iframe morrendo calado.
   */
  automaticSilentRenew: true,

  /** Avisa antes de expirar, para renovar com folga em vez de reagir a um 401 no meio de uma ação. */
  accessTokenExpiringNotificationTimeInSeconds: 60,

  /** O `state` do fluxo carrega o destino original — ver `session.ts`. */
  monitorSession: false,
};
