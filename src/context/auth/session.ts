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
 * divergem: durante uma renovação, o `Authorization` pode sair novo e o `X-Tenant-ID` ausente, e o
 * backend responde 403 sem que o login pareça quebrado.
 *
 * Esta etapa é **deliberadamente neutra**: continua lendo a mesma chave, com o mesmo
 * comportamento. Ela existe para que a troca do mecanismo (Authorization Code + PKCE, token em
 * memória) mude **um** arquivo em vez de oito — ver `migrate-login-to-authorization-code-pkce`.
 *
 * ## Por que há forma síncrona
 *
 * O token é exposto de forma assíncrona porque `OpenAPI.TOKEN` assim exige, e porque no fluxo
 * PKCE ele passará a aguardar uma renovação pendente. Mas **as claims do usuário já carregado
 * precisam de leitura síncrona**: `LoginPage` decide o destino no corpo do render e o
 * `AuthProvider` inicializa estado com o valor. Tornar tudo `Promise` quebraria render e
 * navegação — por isso `getClaims`, `getTenantId` e `getRoles` são síncronas, e permanecerão assim
 * depois da migração (lendo o usuário em memória em vez do storage).
 */

export const TOKEN_STORAGE_KEY = '@Menthoros:token';

/**
 * `localStorage` lança em contextos que o bloqueiam (iframe sandboxed, modo privado de alguns
 * navegadores). Falhar aqui derrubaria o app inteiro no bootstrap, então trata-se como "sem
 * sessão" — mesmo cuidado que `useCalibracao` já toma.
 */
function lerBruto(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Token de acesso atual, ou string vazia quando não há sessão. */
export function getAccessTokenSync(): string {
  return lerBruto();
}

/**
 * Forma assíncrona, exigida por `OpenAPI.TOKEN`. Hoje resolve de imediato; após a migração para
 * PKCE, é aqui que a renovação pendente será aguardada.
 */
export async function getAccessToken(): Promise<string> {
  return getAccessTokenSync();
}

/** Claims do token atual, ou `null` se não houver token ou ele estiver malformado. */
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

/** Persiste o token da sessão. Após a migração, passa a alimentar o store em memória. */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Sem storage não há o que persistir; a sessão vive só nesta aba.
  }
}

/** Encerra a sessão local. */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nada a limpar se o storage não está acessível.
  }
}
