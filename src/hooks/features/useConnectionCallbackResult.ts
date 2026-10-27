import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ConnectionPlataforma } from './useConnection';

const PARAMS: Record<ConnectionPlataforma, string> = {
  INTERVALS_ICU: 'intervals-icu',
  GARMIN: 'garmin',
};

/** `denied` só existe no Garmin: o atleta recusou o consentimento (o callback manda `garmin=denied`). */
export type ConnectionCallbackResult = 'success' | 'error' | 'denied' | null;

/**
 * Remove um parâmetro do query string que vive **dentro do hash**, preservando a rota.
 *
 * Feito com `history.replaceState` e não com `setSearchParams`: sob `createHashRouter`, o
 * `setSearchParams` não surte efeito na URL neste app — verificado isoladamente, inclusive com o
 * padrão canônico do react-router (efeito com `[searchParams, setSearchParams]` nas deps). O
 * parâmetro permanecia na barra de endereço.
 *
 * Mexer no history por fora do router é seguro **neste caso específico**: o que se remove é um
 * query param que nenhuma rota usa para decidir o que renderizar. A rota em si não muda, então o
 * router não fica dessincronizado do que está na tela.
 */
function removerParamDoHash(param: string): void {
  const hash = window.location.hash.replace(/^#/, '');
  const [path, query] = hash.split('?');
  if (!query) return;

  const params = new URLSearchParams(query);
  if (!params.has(param)) return;

  params.delete(param);
  const restante = params.toString();
  window.history.replaceState(null, '', `#${path}${restante ? `?${restante}` : ''}`);
}

/**
 * Lê o desfecho do callback OAuth2 (intervals.icu ou Garmin) na URL e o consome uma única vez.
 *
 * O backend devolve o atleta a `/#/athlete/profile?intervals-icu=success|error` ou
 * `?garmin=success|denied|error`. O parâmetro vai
 * **dentro do hash** de propósito: o app usa `createHashRouter`, então um `?param` antes do `#`
 * seria invisível para o `useSearchParams` — que lê o query string do hash, não o
 * `window.location.search`.
 *
 * O parâmetro é removido da URL assim que lido. Sem isso ele sobreviveria a um F5, e o atleta
 * veria "conectado com sucesso" de novo sem que nada tivesse acontecido.
 *
 * @returns o desfecho na primeira renderização após o retorno, `null` nas demais
 */
export function useConnectionCallbackResult(plataforma: ConnectionPlataforma): ConnectionCallbackResult {
  const param = PARAMS[plataforma];
  const [searchParams] = useSearchParams();
  const [resultado, setResultado] = useState<ConnectionCallbackResult>(null);

  const valorNaUrl = searchParams.get(param);

  useEffect(() => {
    const valido = valorNaUrl === 'success' || valorNaUrl === 'error' || (plataforma === 'GARMIN' && valorNaUrl === 'denied');
    if (!valido) return;

    setResultado(valorNaUrl as ConnectionCallbackResult);
    removerParamDoHash(param);
  }, [valorNaUrl, param, plataforma]);

  return resultado;
}
