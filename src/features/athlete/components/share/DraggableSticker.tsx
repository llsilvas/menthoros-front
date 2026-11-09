import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Box } from '@mui/material';
import type { StickerPos } from '../../hooks/usePhotoStickers';

export interface DraggableStickerProps {
  /** Nome do adesivo para leitor de tela ("distância", "trajeto"...). */
  nome: string;
  pos: StickerPos;
  onMove: (pos: StickerPos) => void;
  /** Adesivo solto (fim do arraste ou tecla liberada): é quando a imagem é regerada. */
  onSoltar: () => void;
  children: ReactNode;
}

const PASSO_TECLADO = 2;

/**
 * Adesivo arrastável por ponteiro (mouse e toque) e por teclado (setas), posicionado em % do pai
 * (athlete-share-cards-mapa, D2). `touch-action: none` impede o navegador de assumir rolagem no meio
 * do gesto; `pointercancel` e `lostpointercapture` encerram o arraste para o adesivo não ficar preso.
 */
export function DraggableSticker({ nome, pos, onMove, onSoltar, children }: DraggableStickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ px: number; py: number; pos: StickerPos } | null>(null);

  const limitar = (x: number, y: number): StickerPos => {
    const el = ref.current;
    const pai = el?.parentElement;
    // Pai sem tamanho (oculto, ou ainda sem layout): não há como limitar — e dividir daria NaN.
    if (!el || !pai || pai.clientWidth === 0 || pai.clientHeight === 0) return { x: Math.max(0, x), y: Math.max(0, y) };
    const maxX = 100 - (el.offsetWidth / pai.clientWidth) * 100;
    const maxY = 100 - (el.offsetHeight / pai.clientHeight) * 100;
    return { x: Math.min(Math.max(0, x), Math.max(0, maxX)), y: Math.min(Math.max(0, y), Math.max(0, maxY)) };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { px: e.clientX, py: e.clientY, pos };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const pai = ref.current?.parentElement;
    if (!inicio.current || !pai || pai.clientWidth === 0 || pai.clientHeight === 0) return;
    const dx = ((e.clientX - inicio.current.px) / pai.clientWidth) * 100;
    const dy = ((e.clientY - inicio.current.py) / pai.clientHeight) * 100;
    onMove(limitar(inicio.current.pos.x + dx, inicio.current.pos.y + dy));
  };
  const encerrar = () => {
    if (!inicio.current) return;
    inicio.current = null;
    onSoltar();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-PASSO_TECLADO, 0], ArrowRight: [PASSO_TECLADO, 0],
      ArrowUp: [0, -PASSO_TECLADO], ArrowDown: [0, PASSO_TECLADO],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    onMove(limitar(pos.x + d[0], pos.y + d[1]));
  };

  return (
    <Box
      ref={ref}
      role="button"
      tabIndex={0}
      aria-roledescription="adesivo arrastável"
      aria-label={`Adesivo ${nome}: ${Math.round(pos.x)}% da esquerda, ${Math.round(pos.y)}% do topo. Use as setas para mover.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={encerrar}
      onPointerCancel={encerrar}
      onLostPointerCapture={encerrar}
      onKeyDown={onKeyDown}
      onKeyUp={(e) => { if (e.key.startsWith('Arrow')) onSoltar(); }}
      sx={{
        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
        touchAction: 'none', cursor: 'grab', userSelect: 'none',
        '&:active': { cursor: 'grabbing' },
        '&:focus-visible': { outline: '2px solid', outlineOffset: '2px' },
      }}
    >
      {children}
    </Box>
  );
}
