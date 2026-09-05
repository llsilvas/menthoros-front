import { useEffect, useState } from 'react';

/** Nome do parâmetro do link do convite: `/#/cadastro?convite=<token>`. */
export const PARAM_CONVITE = 'convite';

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

/**
 * Cache em memória de MÓDULO, não de componente: no app real a página de cadastro REMONTA quando o
 * AuthProvider termina de inicializar, e nesse momento o token já saiu da URL — sem o cache, o
 * remount "esquece" o convite e a página cai no formulário errado (bug pego pelo E2E do convite de
 * atleta; o estado de componente não sobrevive ao remount). Memória apenas: some no reload/aba
 * nova, e continua nunca indo para storage.
 */
let tokenEmMemoria: string | null = null;

/** Descarta o cache do token — usar apenas em testes (isola um teste do anterior). */
export function limparTokenEmMemoria(): void {
  tokenEmMemoria = null;
}

/**
 * Há um convite pendente nesta página (no fragmento ou já lido para a memória)?
 * Usado pelo AuthProvider para NÃO disparar a restauração silenciosa de sessão: ela é um
 * redirect de página inteira que destruiria o token — quem chega por convite não tem sessão
 * para restaurar, e o redirect voltava para a página sem o token (visto no E2E do convite).
 */
export function haConvitePendente(): boolean {
  return lerTokenDoFragmento() !== null || tokenEmMemoria !== null;
}

/**
 * Token do convite (assessoria fundadora ou atleta), se a página foi aberta pelo link do e-mail.
 *
 * O token vive no fragmento (que o browser não envia ao servidor nem no `Referer`) e na memória
 * desta página: é lido no primeiro render e removido da URL logo depois, para não ficar no
 * histórico. Nunca vai para storage. Sob `StrictMode` o efeito roda duas vezes em dev — a remoção é
 * idempotente, então não há efeito colateral. Leitura fresca do fragmento sempre vence o cache.
 */
export function useInviteToken(): string | null {
  const [token] = useState<string | null>(() => {
    const doFragmento = lerTokenDoFragmento();
    if (doFragmento !== null) {
      tokenEmMemoria = doFragmento;
      return doFragmento;
    }
    return tokenEmMemoria;
  });

  useEffect(() => {
    if (token !== null) {
      removerTokenDoFragmento();
    }
  }, [token]);

  return token;
}
