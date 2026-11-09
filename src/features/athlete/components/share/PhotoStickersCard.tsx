import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { surface } from '../../../../theme/tokens';
import { formatKm } from '../../../../utils/formatKm';
import type { RouteView, ShareSignatureView } from '../../types/ShareCard';
import type { StickerId, StickerPos } from '../../hooks/usePhotoStickers';
import { DraggableSticker } from './DraggableSticker';
import { GarminAttribution } from './GarminAttribution';
import { RouteTrace } from './RouteTrace';
import { ShareSignature } from './ShareSignature';
import { displayNumberSx, shareColors } from './shareCardStyle';

export interface PhotoStickersCardProps {
  view: RouteView;
  foto: string | null;
  posicoes: Record<StickerId, StickerPos>;
  onMover: (id: StickerId, pos: StickerPos) => void;
  onSoltar: () => void;
  signature: ShareSignatureView | null;
  mostrarAssessoria: boolean;
}

/** Fundo escuro dos adesivos: contraste sobre qualquer foto, sem `backdrop-filter` (não exporta). */
const fundoAdesivo = alpha(surface[900], 0.62);

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
        <Box sx={{ bgcolor: fundoAdesivo, borderRadius: '16px', px: 1.75, py: 1.25, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            <Typography component="span" sx={{ ...displayNumberSx, fontSize: 52 }}>
              {view.distanciaKm != null ? formatKm(view.distanciaKm) : view.duracao}
            </Typography>
            {view.distanciaKm != null && (
              <Typography component="span" sx={{ ...displayNumberSx, fontSize: 16, color: shareColors.brand, pb: '3px' }}>KM</Typography>
            )}
          </Box>
          <Typography component="span" sx={{ fontSize: 12, color: shareColors.textSecondary }}>
            {[view.duracao, view.paceMedio ? `${view.paceMedio}/km` : null].filter(Boolean).join(' · ')}
          </Typography>
          <GarminAttribution attribution={view.attribution} />
        </Box>
      </DraggableSticker>

      <DraggableSticker nome="trajeto" pos={posicoes.trajeto} onMove={(p) => onMover('trajeto', p)} onSoltar={onSoltar}>
        <Box sx={{ width: 130, height: 130, borderRadius: '50%', bgcolor: fundoAdesivo, p: 2.25 }}>
          <RouteTrace pontos={view.pontos} largura={100} altura={100} espessura={3} />
        </Box>
      </DraggableSticker>

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
