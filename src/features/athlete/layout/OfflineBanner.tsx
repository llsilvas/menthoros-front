import { Box, Typography } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { content, text } from '../../../theme/tokens';

/**
 * Estado offline do shell do atleta — só apresentação, sem ação. Tom neutro, não `semantic.danger`:
 * não é erro do atleta, e os dados voltam sozinhos quando a rede voltar. `role="status"` para o
 * leitor de tela anunciar a mudança sem roubar o foco.
 */
export function OfflineBanner() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1,
        bgcolor: elevation.panel,
        borderTop: `1px solid ${content.divider}`,
      }}
    >
      <Typography variant="body2" sx={{ color: text.secondary }}>
        Você está offline — os dados vão atualizar quando a conexão voltar
      </Typography>
    </Box>
  );
}
