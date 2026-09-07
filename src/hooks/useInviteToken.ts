import { useEffect, useState } from 'react';
import {
  guardarTokenEmMemoria,
  lerTokenDoFragmento,
  removerTokenDoFragmento,
  tokenDaMemoria,
} from '../utils/inviteTokenFragment';

// Re-export para compatibilidade: consumidores antigos importam daqui. A implementação vive em
// `utils/inviteTokenFragment` — módulo neutro, porque o AuthProvider também a consome.
export {
  PARAM_CONVITE,
  haConvitePendente,
  lerTokenDoFragmento,
  limparTokenEmMemoria,
  removerTokenDoFragmento,
} from '../utils/inviteTokenFragment';

/**
 * Token do convite (assessoria fundadora ou atleta), se a página foi aberta pelo link do e-mail.
 *
 * O token vive no fragmento (que o browser não envia ao servidor nem no `Referer`) e na memória
 * desta página: é lido no primeiro render e removido da URL logo depois, para não ficar no
 * histórico. Nunca vai para storage. Sob `StrictMode` o efeito roda duas vezes em dev — a remoção é
 * idempotente, então não há efeito colateral. Leitura fresca do fragmento sempre vence o cache de
 * memória (que existe para sobreviver ao remount da página — ver `utils/inviteTokenFragment`).
 */
export function useInviteToken(): string | null {
  const [token] = useState<string | null>(() => {
    const doFragmento = lerTokenDoFragmento();
    if (doFragmento !== null) {
      guardarTokenEmMemoria(doFragmento);
      return doFragmento;
    }
    return tokenDaMemoria();
  });

  useEffect(() => {
    if (token !== null) {
      removerTokenDoFragmento();
    }
  }, [token]);

  return token;
}
