import { useCallback, useMemo } from 'react';

export interface FetchErrorSource {
  /** Nome em PT-BR, minúsculo, como aparece na frase do Alert ("prontidão", "zonas"). */
  label: string;
  error: Error | null;
  refetch: () => Promise<unknown> | unknown;
}

/**
 * Agrega os erros de vários hooks de dados numa lista de fontes que falharam e num `retryAll`
 * que só refaz o que falhou (design D4 da Home; reutilizado no Progresso). Nasceu na Home — antes
 * cada hook falhava com um Alert próprio e o erro de calibração nem era lido — mas não sabe nada
 * dela: quem decide o que é "falha total" ou "erro de tela inteira" é a página.
 */
export function useAggregatedFetchErrors(fontes: FetchErrorSource[]) {
  const failed = useMemo(() => fontes.filter((f) => f.error !== null).map((f) => f.label), [fontes]);

  const retryAll = useCallback(async () => {
    await Promise.all(fontes.filter((f) => f.error !== null).map((f) => f.refetch()));
  }, [fontes]);

  return { failed, hasErrors: failed.length > 0, retryAll };
}
