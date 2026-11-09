import { useCallback, useState } from 'react';
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

  const escolherFoto = useCallback(async (arquivo: File) => {
    setCarregando(true);
    setError(null);
    try {
      setFoto(await normalizarFoto(arquivo));
      setFotoId((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Foto inválida'));
    } finally {
      setCarregando(false);
    }
  }, []);

  const mover = useCallback((id: StickerId, pos: StickerPos) => {
    setPosicoes((atual) => ({ ...atual, [id]: pos }));
  }, []);

  return { foto, fotoId, carregando, error, posicoes, escolherFoto, mover };
}
