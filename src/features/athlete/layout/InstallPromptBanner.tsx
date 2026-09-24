import { Box, Button, Typography } from '@mui/material';
import { text } from '../../../theme/tokens';
import { shellBannerRowSx } from './shellBannerSx';

interface InstallPromptBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

/**
 * Banner de instalação do PWA — só apresentação. Quem decide se ele aparece (evento do navegador,
 * dispensa lembrada, já instalado) é `useInstallPrompt`; aqui não há estado.
 */
export function InstallPromptBanner({ onInstall, onDismiss }: InstallPromptBannerProps) {
  return (
    <Box
      component="section"
      aria-label="Instalar aplicativo"
      sx={shellBannerRowSx}
    >
      <Typography variant="body2" sx={{ flex: 1, color: text.primary }}>
        Instalar o Menthoros na tela inicial
      </Typography>
      <Button size="small" variant="text" onClick={onDismiss} sx={{ color: text.secondary }}>
        Agora não
      </Button>
      <Button size="small" variant="contained" onClick={onInstall}>
        Instalar
      </Button>
    </Box>
  );
}
