import type { User } from 'oidc-client-ts';
import {
  decodeJwtPayload,
  extractTenantId,
  extractUserRoles,
  type KeycloakJwtPayload,
} from './jwt';

/**
 * Fonte única de leitura do token de acesso e das claims derivadas dele.
 *
 * Antes desta camada, oito pontos liam `localStorage` e decodificavam o JWT por conta própria —
 * `main.tsx` para montar `Authorization` **e** `X-Tenant-ID`, `useUserInfo` para os dados do
 * usuário, `LoginPage` para decidir o destino pós-login. Leituras independentes da mesma coisa
 * divergem: durante uma renovação, o `Authorization` sai novo e o `X-Tenant-ID` ausente, e o backend
 * responde 403 sem que o login pareça quebrado.
 *
 * ## Onde o token vive
 *
 * Em memória, neste módulo — **nada é persistido**. O `AuthProvider` alimenta o snapshot a partir
 * dos eventos do `UserManager` (`definirUsuario`/`limparUsuario`), e este módulo **não conhece o
 * `UserManager`**: a dependência aponta numa direção só, o que o mantém testável sem OIDC.
 *
 * ## Por que há forma síncrona
 *
 * O token é exposto de forma assíncrona porque `OpenAPI.TOKEN` assim exige e porque uma renovação
 * pode estar em curso. Mas **as claims do usuário já carregado precisam de leitura síncrona**:
 * `LoginPage` decide o destino no corpo do render e o `AuthProvider` inicializa estado com o valor.
 * Tornar tudo `Promise` quebraria render e navegação.
 */

/**
 * Chave do mecanismo antigo (ROPC + `localStorage`). Mantida **apenas** para limpar sessões que
 * sobraram da virada — ver `limparTokenLegado`. Nada escreve aqui.
 */
export const TOKEN_STORAGE_KEY = '@Menthoros:token';

let usuarioAtual: User | null = null;
let renovacaoPendente: Promise<unknown> | null = null;

/** Chamado pelo `AuthProvider` quando o `UserManager` carrega ou renova o usuário. */
export function definirUsuario(user: User | null): void {
  usuarioAtual = user;
}

/** Chamado no logout e quando a sessão expira sem renovação. */
export function limparUsuario(): void {
  usuarioAtual = null;
}

/**
 * Registra a renovação em curso, para que `getAccessToken` aguarde em vez de devolver o token velho.
 * Passar `null` limpa o registro.
 */
export function definirRenovacaoPendente(promessa: Promise<unknown> | null): void {
  renovacaoPendente = promessa;
}

/** Token de acesso atual, ou string vazia quando não há sessão. */
export function getAccessTokenSync(): string {
  return usuarioAtual?.access_token ?? '';
}

/**
 * Forma assíncrona, exigida por `OpenAPI.TOKEN`.
 *
 * Se há renovação em curso, aguarda: uma chamada disparada no meio dela sairia com o token velho
 * (401 previsível) ou vazia. A falha da renovação **não** propaga daqui — quem trata é o
 * `AuthProvider`; esta função devolve o que houver e deixa o backend responder.
 */
export async function getAccessToken(): Promise<string> {
  if (renovacaoPendente) {
    await renovacaoPendente.catch(() => undefined);
  }
  return getAccessTokenSync();
}

/** Claims do token atual, ou `null` se não houver sessão ou o token estiver malformado. */
export function getClaims(): KeycloakJwtPayload | null {
  const token = getAccessTokenSync();
  if (!token) return null;
  return decodeJwtPayload(token);
}

/** Tenant do usuário atual — a mesma leitura que origina o token, nunca uma paralela. */
export function getTenantId(): string | undefined {
  const claims = getClaims();
  return claims ? extractTenantId(claims) : undefined;
}

/** Roles do usuário atual; lista vazia quando não há sessão. */
export function getRoles(): string[] {
  const claims = getClaims();
  return claims ? extractUserRoles(claims) : [];
}

/**
 * Remove o token do mecanismo antigo, se ainda houver.
 *
 * Decisão 0.5 da change: na virada, derrubar todas as sessões vigentes em vez de deixá-las expirar.
 * Sem isso, um token velho ficaria no storage enquanto o app já espera sessão em memória — estado
 * híbrido que produz sintoma difícil de atribuir.
 *
 * `localStorage` lança em contextos que o bloqueiam (iframe sandboxed, modo privado). Falhar aqui
 * derrubaria o bootstrap, então o erro é ignorado: não havendo storage, não há legado a limpar.
 */
export function limparTokenLegado(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Sem storage acessível não há nada a limpar.
  }
}
