import { Box, Button, Typography } from '@mui/material';
import { text } from '../../../theme/tokens';
import { shellBannerRowSx } from './shellBannerSx';

interface IosInstallHintBannerProps {
  onDismiss: () => void;
}

/**
 * Hint de instalação para iOS — só apresentação. A Apple não expõe `beforeinstallprompt`, então
 * não há botão "Instalar": o gesto é manual e o texto só ensina onde ele fica. Quem decide se
 * este banner aparece é `useIosInstallHint`.
 */
export function IosInstallHintBanner({ onDismiss }: IosInstallHintBannerProps) {
  return (
    <Box
      component="section"
      aria-label="Instalar no iPhone"
      sx={shellBannerRowSx}
    >
      <Typography variant="body2" sx={{ flex: 1, color: text.primary }}>
        No iPhone: toque em Compartilhar e depois em &apos;Adicionar à Tela de Início&apos;
      </Typography>
      <Button size="small" variant="text" onClick={onDismiss} sx={{ color: text.secondary }}>
        Entendi
      </Button>
    </Box>
  );
}
