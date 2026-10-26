import { surface } from '../../../../theme/tokens';
import { overlayWhite } from '../../../../theme/overlays';

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
        '& .MuiInputLabel-root': { fontSize: '0.75rem', color: surface[500] },
        '& .MuiInputLabel-root.Mui-focused': { color: accent },
        '& select': { fontSize: '0.8125rem', color: surface[100], bgcolor: 'transparent' },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;
}
