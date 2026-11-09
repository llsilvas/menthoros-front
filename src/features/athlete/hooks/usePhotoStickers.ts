import { useCallback, useRef, useState } from 'react';
import { normalizarFoto } from '../utils/normalizarFoto';

export type StickerId = 'distancia' | 'trajeto' | 'assinatura';

/** Posição do canto superior esquerdo do adesivo, em % da área do card. */
export interface StickerPos {
  x: number;
  y: number;
}

const POSICOES_INICIAIS: Record<StickerId, StickerPos> = {
  distancia: { x: 6, y: 60 },
  trajeto: { x: 52, y: 4 },
  assinatura: { x: 6, y: 86 },
};

/**
 * Estado do card Stickers (athlete-share-cards-mapa, D5): foto local normalizada e posição dos
 * adesivos. A foto vira data URL no aparelho e nunca é enviada.
 */
export function usePhotoStickers() {
  const [foto, setFoto] = useState<string | null>(null);
  /** Muda a cada foto escolhida — entra na versão da imagem para regerar o PNG. */
  const [fotoId, setFotoId] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [posicoes, setPosicoes] = useState<Record<StickerId, StickerPos>>(POSICOES_INICIAIS);
  /**
   * Muda só quando um adesivo é solto (fim do arraste ou da tecla). Entra na versão da imagem no lugar
   * das posições: regerar o PNG a cada `pointermove` rasterizaria dezenas de vezes em pixelRatio 3.
   */
  const [layoutId, setLayoutId] = useState(0);
  const pedido = useRef(0);

  const escolherFoto = useCallback(async (arquivo: File) => {
    // Duas escolhas seguidas: só a última pode virar a foto do card.
    const meu = ++pedido.current;
    setCarregando(true);
    setError(null);
    try {
      const normalizada = await normalizarFoto(arquivo);
      if (meu !== pedido.current) return;
      setFoto(normalizada);
      setFotoId((n) => n + 1);
    } catch (e) {
      if (meu === pedido.current) setError(e as Error);
    } finally {
      if (meu === pedido.current) setCarregando(false);
    }
  }, []);

  const mover = useCallback((id: StickerId, pos: StickerPos) => {
    setPosicoes((atual) => ({ ...atual, [id]: pos }));
  }, []);

  const soltar = useCallback(() => setLayoutId((n) => n + 1), []);

  return { foto, fotoId, carregando, error, posicoes, layoutId, escolherFoto, mover, soltar };
}
