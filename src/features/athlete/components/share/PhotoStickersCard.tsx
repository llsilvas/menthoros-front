import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { surface } from '../../../../theme/tokens';
import { formatKm } from '../../../../utils/formatKm';
import type { RouteView, ShareSignatureView, TreadmillView } from '../../types/ShareCard';
import type { StickerId, StickerPos } from '../../hooks/usePhotoStickers';
import { DraggableSticker } from './DraggableSticker';
import { GarminAttribution } from './GarminAttribution';
import { RouteTrace } from './RouteTrace';
import { ShareSignature } from './ShareSignature';
import { TreadmillBadge } from './TreadmillCard';
import { displayNumberSx, monoSx, shareColors } from './shareCardStyle';

export interface PhotoStickersCardProps {
  /** Rota (com trajeto) ou Esteira (sem GPS: o adesivo do trajeto vira o selo). */
  view: RouteView | TreadmillView;
  foto: string | null;
  posicoes: Record<StickerId, StickerPos>;
  onMover: (id: StickerId, pos: StickerPos) => void;
  onSoltar: () => void;
  signature: ShareSignatureView | null;
  mostrarAssessoria: boolean;
}

/** Fundo escuro dos adesivos: contraste sobre qualquer foto, sem `backdrop-filter` (não exporta). */
const fundoAdesivo = alpha(surface[900], 0.62);

/** Bloco de dados dos artboards v2 Stickers / v2 K: verde da marca, levemente girado, com sombra. */
const blocoDados = {
  bgcolor: shareColors.brand,
  color: shareColors.canvas,
  borderRadius: '20px',
  px: '16px',
  pt: '12px',
  pb: '10px',
  transform: 'rotate(-2deg)',
  boxShadow: `0 12px 32px ${alpha(surface[900], 0.4)}`,
} as const;

/**
 * Corpo do card "Foto" (Stickers, athlete-share-cards-mapa D5): os adesivos sobre a foto do atleta.
 * A foto em si é o fundo do `ShareCardFrame` (ver {@link PhotoBackground}). A atribuição Garmin fica
 * dentro do adesivo de distância para não poder ser separada dele (guideline Garmin).
 */
export function PhotoStickersCard({ view, foto, posicoes, onMover, onSoltar, signature, mostrarAssessoria }: PhotoStickersCardProps) {
  if (!foto) {
    return (
      <Box sx={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `1px dashed ${alpha(shareColors.text, 0.3)}`, borderRadius: '16px', p: 3 }}>
        <Typography sx={{ color: shareColors.textSecondary, fontSize: 14 }}>Escolha uma foto abaixo para montar o card.</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ flex: '1 1 0', position: 'relative' }}>
      <DraggableSticker nome="distância" pos={posicoes.distancia} onMove={(p) => onMover('distancia', p)} onSoltar={onSoltar}>
        <Box sx={{ ...blocoDados, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {view.kind === 'esteira' && (
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em' }}>{view.titulo}</Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <Typography component="span" sx={{ ...displayNumberSx, fontSize: 84, letterSpacing: '-0.04em' }}>
              {view.distanciaKm != null ? formatKm(view.distanciaKm) : view.duracao}
            </Typography>
            {view.distanciaKm != null && (
              <Typography component="span" sx={{ ...displayNumberSx, fontWeight: 700, fontSize: 23, lineHeight: 1, pb: '4px' }}>KM</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: '12px' }}>
            {[view.duracao, view.paceMedio ? `${view.paceMedio} /km` : null].filter(Boolean).map((t) => (
              <Typography key={t} component="span" sx={{ ...monoSx, fontSize: 12 }}>{t}</Typography>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', pt: '6px', borderTop: `1px solid ${alpha(shareColors.canvas, 0.15)}` }}>
            <GarminAttribution attribution={view.attribution} color={shareColors.canvas} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 11, fontWeight: 700 }}>
              <Box component="svg" width={12} height={12} viewBox="0 0 24 24" aria-hidden sx={{ fill: 'none', stroke: shareColors.canvas, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d="M3 19V6l9 9 9-9v13" />
              </Box>
              menthoros
            </Box>
          </Box>
        </Box>
      </DraggableSticker>

      {view.kind === 'rota' ? (
        <DraggableSticker nome="trajeto" pos={posicoes.trajeto} onMove={(p) => onMover('trajeto', p)} onSoltar={onSoltar}>
          <Box sx={{ width: 130, height: 130, borderRadius: '50%', bgcolor: fundoAdesivo, p: 2.25 }}>
            <RouteTrace pontos={view.pontos} largura={100} altura={100} espessura={3} />
          </Box>
        </DraggableSticker>
      ) : (
        <DraggableSticker nome="esteira" pos={posicoes.trajeto} onMove={(p) => onMover('trajeto', p)} onSoltar={onSoltar}>
          <TreadmillBadge adesivo />
        </DraggableSticker>
      )}

      {mostrarAssessoria && signature && (
        <DraggableSticker nome="assinatura" pos={posicoes.assinatura} onMove={(p) => onMover('assinatura', p)} onSoltar={onSoltar}>
          <Box sx={{ bgcolor: fundoAdesivo, borderRadius: '999px', px: 1.25, py: 0.75 }}>
            <ShareSignature signature={signature} visible />
          </Box>
        </DraggableSticker>
      )}
    </Box>
  );
}

/** Foto do atleta ocupando o card inteiro, com um véu escuro no topo para a marca continuar legível. */
export function PhotoBackground({ foto }: { foto: string }) {
  return (
    <>
      <Box component="img" src={foto} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(${alpha(surface[900], 0.55)}, transparent 28%)` }} />
    </>
  );
}
