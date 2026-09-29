import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ElementType, MouseEventHandler, ReactNode } from 'react';
import { buildCardSx } from './cardStyles';
import type { CardStateColor, CardVariant } from './cardStyles';

export interface CardProps {
  variant?: CardVariant;
  /** Liga cursor: pointer e um estilo de :hover. Presença de `onClick` implica isso mesmo sem a prop. */
  interactive?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  /** Borda 2px + fundo tingido na cor semântica — tem precedência sobre o hover (ver PM6). */
  stateColor?: CardStateColor;
  /** Permite landmarks de acessibilidade, ex.: component="section" + aria-label. */
  component?: ElementType;
  'aria-label'?: string;
  'data-testid'?: string;
  padding?: 2 | 2.5 | 3;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function Card({
  variant = 'flat',
  interactive,
  onClick,
  stateColor,
  component,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  padding = 2,
  children,
  sx,
}: CardProps) {
  const cardSx = buildCardSx({ variant, interactive, onClick, stateColor, padding });
  const extraSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  const mergedSx: SxProps<Theme> = [cardSx, ...extraSx] as SxProps<Theme>;

  return (
    <Box
      {...(component ? { component } : {})}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      onClick={onClick}
      sx={mergedSx}
    >
      {children}
    </Box>
  );
}
