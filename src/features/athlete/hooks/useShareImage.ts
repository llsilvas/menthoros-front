import { useEffect, useState, type RefObject } from 'react';
import { toBlob } from 'html-to-image';
import { SHARE_EXPORT_PIXEL_RATIO } from '../components/share/shareCardStyle';

/**
 * Rasteriza o card em PNG sempre que `version` muda. O blob fica pronto antes do clique porque o
 * Safari iOS só aceita `navigator.share` com ativação de usuário recente — gerar a imagem dentro do
 * clique consome essa janela e o share falha.
 */
export function useShareImage(nodeRef: RefObject<HTMLElement | null>, version: string) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let atual = true;
    setBlob(null);
    setError(null);
    (async () => {
      try {
        await document.fonts?.ready;
        const node = nodeRef.current;
        if (!node) return;
        const gerado = await toBlob(node, { pixelRatio: SHARE_EXPORT_PIXEL_RATIO, cacheBust: true });
        if (!atual) return;
        if (!gerado) throw new Error('Imagem vazia');
        setBlob(gerado);
      } catch (e) {
        if (atual) setError(e as Error);
      }
    })();
    return () => {
      atual = false;
    };
  }, [nodeRef, version]);

  return { blob, generating: !blob && !error, error };
}
