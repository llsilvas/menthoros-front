import { useId, type FormEventHandler, type ReactNode } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
import type { Breakpoint } from '@mui/material';
import { elevation } from '../design-tokens';
import { content, surface } from '../../theme/tokens';

interface CoachDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Linha secundária sob o título (descrição do dialog). */
  subtitle?: ReactNode;
  /** Chip/badge renderizado acima do título (ex.: "Edição", "Projeção de Prova"). */
  chip?: ReactNode;
  /** Largura máxima do dialog (padrão `sm`). */
  maxWidth?: Breakpoint;
  /** Ocupa a tela inteira em telas pequenas (padrão `true`). */
  fullScreenOnMobile?: boolean;
  /** Conteúdo opcional à direita do título, antes do botão de fechar (toggles, ações de cabeçalho). */
  headerAction?: ReactNode;
  /** Exibe o botão de fechar no canto do header (padrão `true`). */
  showClose?: boolean;
  /** Desabilita o botão de fechar (ex.: durante carregamento). */
  disableClose?: boolean;
  /** Rodapé de ações; quando ausente, o `DialogActions` não é renderizado. */
  actions?: ReactNode;
  /** Texto auxiliar alinhado à esquerda do rodapé de ações (ex.: tempo estimado). */
  actionsHint?: ReactNode;
  /** Renderiza o corpo dentro de um `<form>` (resolve o clipping do `DialogActions`). */
  component?: 'form';
  /** Handler de submit; usado apenas quando `component="form"`. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** Sobrescreve/estende o estilo do `DialogContent`. */
  contentSx?: SxProps<Theme>;
  /** Adiciona dividers no `DialogContent`. */
  dividers?: boolean;
  children: ReactNode;
}

const HEADER_BG = `linear-gradient(135deg, ${elevation.base} 0%, ${elevation.panel} 55%, ${elevation.card} 100%)`;

/**
 * Shell único dos dialogs do coach: superfície dark-first (`elevation.highest`), header com gradiente e
 * tipografia Syne, botão de fechar e rodapé padronizados, `fullScreen` responsivo e `<form>` opcional.
 * Centraliza a linguagem visual e o tratamento do clipping de ações em formulários.
 *
 * Padrões de uso (montar os nós fora do JSX de retorno e passá-los via prop):
 *
 * 1. Diálogo simples (confirmação):
 * ```tsx
 * <CoachDialog open={open} onClose={onClose} maxWidth="xs" title="Excluir?"
 *   actions={<><Button sx={GHOST_BTN_SX} onClick={onClose}>Cancelar</Button>
 *            <Button sx={DANGER_BTN_SX} onClick={onConfirm}>Excluir</Button></>}>
 *   <Typography>...</Typography>
 * </CoachDialog>
 * ```
 *
 * 2. Formulário (usa `component="form"` + `onSubmit`; o botão de submit vai em `actions`):
 * ```tsx
 * <CoachDialog open={open} onClose={handleClose} component="form" onSubmit={handleSubmit}
 *   chip={meuChip} title="Editar" subtitle="..."
 *   actions={<Button type="submit" sx={PRIMARY_BTN_SX}>Salvar</Button>}>
 *   {campos}
 * </CoachDialog>
 * ```
 *
 * Convenções: `chip`/`subtitle`/`actionsHint` são nós montados inline antes do `return`;
 * botões de ação sempre usam os helpers de `actionButtonSx` (PRIMARY/SUCCESS/DANGER/GHOST).
 */
export function CoachDialog({
  open,
  onClose,
  title,
  subtitle,
  chip,
  maxWidth = 'sm',
  fullScreenOnMobile = true,
  headerAction,
  showClose = true,
  disableClose = false,
  actions,
  actionsHint,
  component,
  onSubmit,
  contentSx,
  dividers,
  children,
}: CoachDialogProps) {
  const titleId = useId();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const body = (
    <>
      <DialogContent dividers={dividers} sx={{ px: { xs: 2, md: 2.5 }, py: 2, ...contentSx }}>
        {children}
      </DialogContent>

      {actions ? (
        <DialogActions
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 2,
            gap: 1,
            background: elevation.panel,
            borderTop: `1px solid ${content.divider}`,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          {actionsHint ? <Box sx={{ flexGrow: 1, minWidth: 0 }}>{actionsHint}</Box> : null}
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>{actions}</Box>
        </DialogActions>
      ) : null}
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreenOnMobile && isMobile}
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
          position: 'relative',
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.75, md: 2 },
          pr: showClose ? { xs: 7, md: 8 } : { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          background: HEADER_BG,
          borderBottom: `1px solid ${content.divider}`,
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {chip ? <Box sx={{ mb: 1 }}>{chip}</Box> : null}
          <Typography
            id={titleId}
            // `component="h2"` dá ao título o role de heading: sem ele, nenhum dialog do coach
            // expõe cabeçalho para leitor de tela, e num dialog bloqueante — consentimento,
            // wizard — a AT não anuncia onde o usuário está. Não muda nada visualmente.
            component="h2"
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              lineHeight: 1.15,
              color: surface[50],
              fontSize: { xs: '1.05rem', md: '1.25rem' },
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.75, color: surface[400], fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {headerAction}

        {showClose ? (
          <IconButton
            onClick={onClose}
            disabled={disableClose}
            aria-label="Fechar"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: surface[50],
              bgcolor: content.inputBg,
              border: `1px solid ${surface[0]}14`,
              '&:hover': { bgcolor: content.cardBgHover },
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </Box>

      {component === 'form' ? (
        <form onSubmit={onSubmit} noValidate style={{ display: 'contents' }}>
          {body}
        </form>
      ) : (
        body
      )}
    </Dialog>
  );
}
