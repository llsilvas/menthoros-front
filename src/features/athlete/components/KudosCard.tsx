import { Box, Typography } from '@mui/material';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { glassSx, surface, primary } from '../../../theme/tokens';
import type { KudosRecente, MotivoKudos } from '../../../types/Kudos';

const MOTIVO_TEXTO: Record<MotivoKudos, string> = {
  CONSISTENCIA: 'consistência',
  MELHORA: 'melhora',
  ESFORCO: 'esforço',
  SUPERACAO: 'superação',
  VOLTA: 'volta por cima',
};

export interface KudosCardProps {
  kudos: KudosRecente[];
}

/** Kudos recentes recebidos do coach — omitido inteiramente quando não há nenhum (estado vazio honesto). */
export function KudosCard({ kudos }: KudosCardProps) {
  if (kudos.length === 0) return null;

  return (
    <Box sx={{ ...glassSx, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {kudos.slice(0, 3).map((k) => (
        <Box key={k.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EmojiEventsIcon sx={{ color: primary[500], fontSize: 24 }} />
          <Typography sx={{ color: surface[50], fontWeight: 700 }}>
            Seu coach reconheceu sua {MOTIVO_TEXTO[k.motivo]}!
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default KudosCard;
