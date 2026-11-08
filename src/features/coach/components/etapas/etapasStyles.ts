import { alpha, type Theme } from '@mui/material/styles';
import { primary, surface } from '../../../../theme/tokens';
import { elevation, radius } from '../../../../shared/design-tokens';
import { overlayBlack, overlayWhite } from '../../../../theme/overlays';

/**
 * Estilos do editor de etapas, compartilhados por `EtapasEditor` e `TreinoAddDialog` — antes cada
 * um tinha o seu `fieldSx`/`FIELD_SX`, com hex concatenado num e overlay no outro.
 */

/** Rótulo de seção: mesma receita do `PlanoSemanaPanel` (caixa alta, 0.6875rem, 0.08em). */
export const EYEBROW_SX = {
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: surface[400],
} as const;

/** Campo compacto do editor; o foco assume a cor de acento (a do tipo da etapa, ou a da marca). */
export function fieldSx(accent: string) {
    return {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            color: surface[100],
            bgcolor: overlayWhite[4],
            borderRadius: '6px',
            '& fieldset': { borderColor: overlayWhite[10] },
            '&:hover fieldset': { borderColor: overlayWhite[22] },
            '&.Mui-focused fieldset': { borderColor: accent },
        },
        '& .MuiInputLabel-root': { fontSize: '0.75rem', color: surface[400] },
        '& .MuiInputLabel-root.Mui-focused': { color: accent },
        '& select': { fontSize: '0.8125rem', color: surface[100], bgcolor: 'transparent' },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;
}

/**
 * Alça de arrastar de um item raiz do editor. Só ela tem `touch-action: none`: no card inteiro o
 * gesto viraria arrasto e a página pararia de rolar no celular. Abaixo de `sm` a área de toque
 * sobe para 44px sem mudar o ícone.
 */
export const DRAG_HANDLE_SX = (theme: Theme) => ({
    color: surface[400],
    cursor: 'grab',
    touchAction: 'none',
    ml: -0.75,
    '&:hover': { color: surface[50], bgcolor: overlayWhite[8] },
    '&:active': { cursor: 'grabbing' },
    '&.Mui-disabled': { color: surface[600], cursor: 'default' },
    [theme.breakpoints.down('sm')]: { width: 44, height: 44, ml: -1.25 },
}) as const;

/** Item raiz durante o arrasto: sobe um degrau de elevação e ganha a borda de seleção (lime). */
export function sortableRowSx(arrastando: boolean) {
    return {
        position: 'relative',
        ...(arrastando
            ? {
                zIndex: 1,
                opacity: 0.92,
                borderRadius: radius.md,
                bgcolor: elevation.highest,
                boxShadow: `0 4px 12px ${overlayBlack[25]}, 0 16px 32px ${overlayBlack[40]}`,
                outline: `1px solid ${alpha(primary[500], 0.45)}`,
            }
            : {}),
    } as const;
}
