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

/**
 * O código de autorização só pode ser trocado **uma vez**.
 *
 * O `StrictMode` monta os efeitos duas vezes em desenvolvimento, então `signinCallback()` era
 * chamado duas vezes com o mesmo `code`. O Keycloak trata a segunda como replay — e a punição não é
 * só recusar a troca: ele **remove a client session**.
 *
 * ```
 * OAuth2CodeParser  Code '...' already used for userSession ...
 * events            type="CODE_TO_TOKEN_ERROR" error="invalid_code"
 * (na renovação seguinte)
 * events            type="REFRESH_TOKEN_ERROR" reason="Session doesn't have required client"
 * ```
 *
 * **O defeito é anterior à renovação silenciosa, mas só apareceu com ela.** Enquanto a renovação era
 * um redirect completo a cada ~4 minutos, o app ganhava uma sessão nova antes de precisar da antiga,
 * e a client session morta nunca fazia falta. Ao passar a depender do refresh token, ela passa a ser
 * a única que existe.
 *
 * Causalidade verificada por experimento em 2026-08-06: com `StrictMode` desligado, nenhuma
 * ocorrência de `already used`; religado, uma por carregamento.
 *
 * Memoizar a **promessa** (e não um booleano) faz a segunda chamada aguardar o mesmo resultado, em
 * vez de seguir como se não houvesse sessão.
 */
let trocaDeCodigo: Promise<Awaited<ReturnType<typeof userManager.signinCallback>>> | null = null;

export function trocarCodigoUmaVez() {
  trocaDeCodigo ??= userManager.signinCallback();
  return trocaDeCodigo;
}

/** Libera a guarda para um novo fluxo — usado após concluir (ou falhar) o callback. */
export function liberarTrocaDeCodigo(): void {
  trocaDeCodigo = null;
}

/** Chave do `state` onde viaja a rota de origem, para restaurar o destino após o callback. */
export const CHAVE_DESTINO = 'destino';

/** `true` quando a URL atual é o retorno do fluxo de autorização (traz `code` e `state`). */
export function ehRetornoDeAutorizacao(url: string = window.location.href): boolean {
  const params = new URL(url).searchParams;
  return params.has('code') && params.has('state');
}

/**
 * `true` quando o Keycloak recusou uma tentativa **silenciosa** de restaurar a sessão.
 *
 * Com `prompt=none`, não havendo sessão no provedor, o retorno vem com `error=login_required` (ou
 * `interaction_required`) em vez de `code`. Isso não é falha: é a resposta correta para "tenta sem
 * incomodar o usuário".
 */
export function ehRecusaDeLoginSilencioso(url: string = window.location.href): boolean {
  const erro = new URL(url).searchParams.get('error');
  return erro === 'login_required' || erro === 'interaction_required';
}

/**
 * Guarda contra laço de restauração.
 *
 * A restauração silenciosa é um redirect. Se ela falhar e o bootstrap tentar de novo, o par
 * app↔Keycloak entra em laço infinito — e o sintoma (tela piscando sem parar) é pior que o problema
 * que se queria resolver. A marca vive em `sessionStorage` porque precisa sobreviver ao redirect,
 * mas não à aba.
 */
const CHAVE_TENTATIVA = 'menthoros:restauracao-tentada';

export function jaTentouRestaurar(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_TENTATIVA) === '1';
  } catch {
    // Sem sessionStorage não há como evitar o laço com segurança; melhor não tentar restaurar.
    return true;
  }
}

export function marcarTentativaDeRestauracao(): void {
  try {
    sessionStorage.setItem(CHAVE_TENTATIVA, '1');
  } catch {
    // Ignorado: o `jaTentouRestaurar` já falha fechado.
  }
}

/**
 * Rota de onde a restauração silenciosa partiu.
 *
 * Existe porque o retorno do Keycloak cai sempre na raiz (é o `redirect_uri`) e perde o hash. Sem
 * guardar a origem, quem abriu uma rota **pública** sem sessão é jogado no login — inclusive quem
 * foi criar a conta, que é justamente quem ainda não tem uma.
 */
const CHAVE_ORIGEM = 'menthoros:restauracao-origem';

/** Rotas que não exigem sessão. Devem espelhar as registradas fora do `ProtectedRoute`. */
const ROTAS_PUBLICAS = new Set(['', '#/', '#/cadastro', '#/waitlist', '#/privacidade', '#/termos', '#/auth/login']);

export function guardarRotaDeOrigem(hash: string = window.location.hash): void {
  try {
    sessionStorage.setItem(CHAVE_ORIGEM, hash);
  } catch {
    // Sem sessionStorage o destino se perde e o usuário cai no login — degradação aceitável.
  }
}

export function lerRotaDeOrigem(): string {
  try {
    return sessionStorage.getItem(CHAVE_ORIGEM) ?? '';
  } catch {
    return '';
  }
}

export function ehRotaPublica(hash: string): boolean {
  // Ignora query dentro do hash (`#/cadastro?x=1`) — o que decide é o caminho.
  return ROTAS_PUBLICAS.has(hash.split('?')[0]);
}

export function limparTentativaDeRestauracao(): void {
  try {
    sessionStorage.removeItem(CHAVE_TENTATIVA);
    sessionStorage.removeItem(CHAVE_ORIGEM);
  } catch {
    // Nada a limpar.
  }
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
  // `error` também: o retorno de uma recusa silenciosa traz `?error=login_required`, e deixá-lo na
  // barra de endereço mostra ao usuário um erro técnico de um fluxo que nem era visível para ele.
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, document.title, url.toString());
}
