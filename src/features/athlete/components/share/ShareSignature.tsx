import { Box, Typography } from '@mui/material';
import type { ShareSignatureView } from '../../types/ShareCard';
import { shareColors } from './shareCardStyle';

export interface ShareSignatureProps {
  signature: ShareSignatureView | null;
  visible: boolean;
}

/** Selo com a sigla e o nome da assessoria. Logo e "Treinado por" chegam em athlete-share-cards-extra. */
export function ShareSignature({ signature, visible }: ShareSignatureProps) {
  if (!visible || !signature) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} data-testid="share-signature">
      <Box
        aria-hidden
        sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: shareColors.canvas, border: `1.5px solid ${shareColors.brand}`,
          fontSize: 10, fontWeight: 700, color: shareColors.text,
        }}
      >
        {signature.sigla}
      </Box>
      <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, color: shareColors.text }}>
        {signature.nome}
      </Typography>
    </Box>
  );
}
