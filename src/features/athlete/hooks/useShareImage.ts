import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { toBlob } from 'html-to-image';
import { SHARE_EXPORT_PIXEL_RATIO } from '../components/share/shareCardStyle';

/**
 * Rasteriza o card em PNG sempre que `version` muda. O blob fica pronto antes do clique porque o
 * Safari iOS só aceita `navigator.share` com ativação de usuário recente — gerar a imagem dentro do
 * clique consome essa janela e o share falha.
 *
 * `podeCapturar` é consultado **imediatamente antes** do `toBlob` (athlete-share-cards-mapa, D4): é o
 * que garante que nenhum PNG com trajeto sai sem consentimento, mesmo quando o modelo troca enquanto
 * uma geração anterior ainda espera as fontes.
 */
export function useShareImage(nodeRef: RefObject<HTMLElement | null>, version: string, podeCapturar?: () => boolean) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const podeRef = useRef(podeCapturar);

  // Layout effect roda antes do effect de geração: a captura sempre lê a regra do render atual.
  useLayoutEffect(() => {
    podeRef.current = podeCapturar;
  });

  useEffect(() => {
    let atual = true;
    setBlob(null);
    setError(null);
    setBloqueado(false);
    (async () => {
      try {
        await document.fonts?.ready;
        // Geração obsoleta não captura: o DOM pode já mostrar outro modelo.
        if (!atual) return;
        if (podeRef.current && !podeRef.current()) {
          setBloqueado(true);
          return;
        }
        const node = nodeRef.current;
        if (!node) throw new Error('Card não montado');
        // cacheBust desligado: ele acrescenta query também a URLs `blob:`/`data:` e quebra a foto (D5).
        const gerado = await toBlob(node, { pixelRatio: SHARE_EXPORT_PIXEL_RATIO, cacheBust: false });
        if (!atual) return;
        if (!gerado) throw new Error('Imagem vazia');
        setBlob(gerado);
      } catch (e) {
        if (atual) setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      atual = false;
    };
  }, [nodeRef, version]);

  return { blob, generating: !blob && !error && !bloqueado, error };
}
