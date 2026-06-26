import { useId, type ReactNode } from 'react';
import { Box, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import type { Breakpoint } from '@mui/material';
import { elevation } from '../../../shared/design-tokens';
import { content, surface } from '../../../theme/tokens';

interface CoachDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Largura máxima do dialog (padrão `sm`). */
  maxWidth?: Breakpoint;
  /** Conteúdo opcional à direita do título (toggles, botões de cabeçalho). */
  headerAction?: ReactNode;
  /** Rodapé de ações; quando ausente, o `DialogActions` não é renderizado. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Dialog base do shell coach: superfície dark-first (`elevation.highest`), borda e divisores via tokens,
 * header em caixa-alta. Encapsula o padrão dos dialogs nativos do shell coach (ex.: TreinoEditDialog) para
 * os dialogs reutilizados herdarem a mesma linguagem visual.
 */
export function CoachDialog({ open, onClose, title, maxWidth = 'sm', headerAction, actions, children }: CoachDialogProps) {
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: {
            bgcolor: elevation.highest,
            border: `1px solid ${content.cardBorder}`,
            borderRadius: '12px',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.5, md: 1.75 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: `1px solid ${content.divider}`,
        }}
      >
        <Typography
          id={titleId}
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            color: surface[50],
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </Typography>
        {headerAction}
      </Box>

      <DialogContent sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>{children}</DialogContent>

      {actions ? (
        <DialogActions sx={{ px: { xs: 2, md: 2.5 }, pb: 2, gap: 1 }}>{actions}</DialogActions>
      ) : null}
    </Dialog>
  );
}
