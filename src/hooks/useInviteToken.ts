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
 * Token do convite de assessoria fundadora, se a página foi aberta pelo link do e-mail.
 *
 * O token vive no fragmento (que o browser não envia ao servidor nem no `Referer`) e na memória
 * desta página: é lido no primeiro render e removido da URL logo depois, para não ficar no
 * histórico. Nunca vai para storage. Sob `StrictMode` o efeito roda duas vezes em dev — a remoção é
 * idempotente, então não há efeito colateral.
 */
export function useInviteToken(): string | null {
  const [token] = useState<string | null>(lerTokenDoFragmento);

  useEffect(() => {
    if (token !== null) {
      removerTokenDoFragmento();
    }
  }, [token]);

  return token;
}
