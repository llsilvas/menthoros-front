/**
 * Utilitários do token de convite no fragmento da URL (`/#/cadastro?convite=<token>`).
 *
 * Vivem num módulo neutro (não no hook de página) de propósito: o `AuthProvider` também precisa
 * saber se há convite pendente — importar isso de um "hook de cadastro" leria como acoplamento
 * errado de camada, quando na verdade é utilitário puro compartilhado.
 */

/** Nome do parâmetro do link do convite: `/#/cadastro?convite=<token>`. */
export const PARAM_CONVITE = 'convite';

/** Rota onde o convite é aceito — o guard de auth só considera convite pendente NELA. */
const CAMINHO_CADASTRO = '#/cadastro';

/**
 * Cache em memória de MÓDULO, não de componente: no app real a página de cadastro REMONTA quando o
 * AuthProvider termina de inicializar, e nesse momento o token já saiu da URL — sem o cache, o
 * remount "esquece" o convite e a página cai no formulário errado (bug pego pelo E2E do convite de
 * atleta; o estado de componente não sobrevive ao remount). Memória apenas: some no reload/aba
 * nova, e continua nunca indo para storage.
 *
 * LIMITE assumido: um único fluxo de convite por navegação. Um segundo consumidor simultâneo de
 * `useInviteToken` herdaria o token do primeiro — se isso um dia existir, o cache precisa virar
 * por-chave, não singleton.
 */
let tokenEmMemoria: string | null = null;

/** Divide o fragmento em caminho e query na PRIMEIRA `?` — o resto é query, `?` dentro de valor incluso. */
function partesDoFragmento(hash: string): { caminho: string; query: string | null } {
  const i = hash.indexOf('?');
  return i < 0 ? { caminho: hash, query: null } : { caminho: hash.slice(0, i), query: hash.slice(i + 1) };
}

/** Lê o token do fragmento. Direto do `location.hash`: uma leitura só, no primeiro render. */
export function lerTokenDoFragmento(): string | null {
  const { query } = partesDoFragmento(window.location.hash);
  if (query === null) {
    return null;
  }
  return new URLSearchParams(query).get(PARAM_CONVITE)?.trim() || null;
}

/** Guarda o token no cache de memória (chamado pelo hook ao ler o fragmento). */
export function guardarTokenEmMemoria(token: string): void {
  tokenEmMemoria = token;
}

/** Token do cache de memória, se houver (sobrevive ao remount, não ao reload). */
export function tokenDaMemoria(): string | null {
  return tokenEmMemoria;
}

/** Descarta o cache do token — usar apenas em testes (isola um teste do anterior). */
export function limparTokenEmMemoria(): void {
  tokenEmMemoria = null;
}

/**
 * Há um convite pendente NA ROTA DE CADASTRO (no fragmento ou já lido para a memória)?
 *
 * Usado pelo AuthProvider para NÃO disparar a restauração silenciosa de sessão: ela é um redirect
 * de página inteira que destruiria o token — quem chega por convite não tem sessão para restaurar.
 * Restrito à rota `#/cadastro` de propósito: um `?convite=` forjado em qualquer outra rota não
 * pode desligar a restauração de quem já tem sessão (superfície de UX-DoS apontada no QA).
 */
export function haConvitePendente(): boolean {
  const { caminho } = partesDoFragmento(window.location.hash);
  if (caminho !== CAMINHO_CADASTRO) {
    return false;
  }
  return lerTokenDoFragmento() !== null || tokenEmMemoria !== null;
}

/**
 * Tira só o token da barra de endereço e do histórico, preservando os demais parâmetros. Não passa
 * pelo router de propósito: `replaceState` limpa a URL sem disparar navegação, e o router não
 * precisa saber do token. Idempotente — chamar de novo sem token é no-op.
 */
export function removerTokenDoFragmento(): void {
  const { caminho, query } = partesDoFragmento(window.location.hash);
  if (query === null) {
    return;
  }
  const params = new URLSearchParams(query);
  if (!params.has(PARAM_CONVITE)) {
    return;
  }
  params.delete(PARAM_CONVITE);
  const resto = params.toString();
  window.history.replaceState(window.history.state, '', resto ? `${caminho}?${resto}` : caminho);
}
