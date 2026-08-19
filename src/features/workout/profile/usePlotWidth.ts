import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Largura de referência quando ainda não há medida — primeiro render e jsdom,
 * onde todo `getBoundingClientRect` devolve zero.
 *
 * É fallback, nunca a fonte: a geometria (piso de 3px, redistribuição, larguras
 * em px) precisa ser calculada contra a largura REAL do plot. Assumir um valor
 * fixo faz a soma das larguras estourar o container — os blocos do fim vazam e
 * são cortados pelo `overflow: hidden`, e o eixo de tempo passa a mentir sem
 * que nada acuse.
 */
export const LARGURA_FALLBACK = 600;

/** Mede a largura do elemento do plot, para a geometria não trabalhar no escuro. */
export function usePlotWidth() {
  const elemento = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  const ref = useCallback((node: HTMLDivElement | null) => {
    elemento.current = node;
    if (node) setWidth(node.getBoundingClientRect().width);
  }, []);

  useEffect(() => {
    const node = elemento.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entradas) => {
      setWidth(entradas[0]?.contentRect.width ?? 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width: width > 0 ? width : LARGURA_FALLBACK, measured: width > 0 };
}
