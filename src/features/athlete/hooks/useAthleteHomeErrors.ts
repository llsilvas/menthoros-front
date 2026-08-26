import { useCallback, useMemo } from 'react';

export interface HomeErrorSource {
  /** Nome em PT-BR, minúsculo, como aparece na frase do Alert ("prontidão", "streak"). */
  label: string;
  error: Error | null;
  refetch: () => Promise<unknown> | unknown;
}

/**
 * Agrega os erros dos hooks secundários da Home num único `Alert` (design D4). Antes cada hook
 * falhava com um Alert próprio — em falha parcial a Home virava uma pilha de avisos — e o erro de
 * calibração nem era lido. O erro do resumo principal (`useAthleteHome`) fica fora: é a tela de erro.
 */
export function useAthleteHomeErrors(fontes: HomeErrorSource[]) {
  const failed = useMemo(() => fontes.filter((f) => f.error !== null).map((f) => f.label), [fontes]);

  const retryAll = useCallback(async () => {
    await Promise.all(fontes.filter((f) => f.error !== null).map((f) => f.refetch()));
  }, [fontes]);

  return { failed, hasErrors: failed.length > 0, retryAll };
}
