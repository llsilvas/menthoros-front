import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { semantic, surface } from '../../theme/tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatusBadgeVariant =
  | 'active'
  | 'warning'
  | 'danger'
  | 'paused'
  | 'inactive'
  | 'pending';

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

// ── Token maps ────────────────────────────────────────────────────────────────

interface BadgeTokens {
  bg: string;
  color: string;
}

function getTokens(variant: StatusBadgeVariant): BadgeTokens {
  switch (variant) {
    case 'active':
      return {
        bg: alpha(semantic.success[500], 0.15),
        color: semantic.success[500],
      };
    case 'warning':
      return {
        bg: alpha(semantic.warning[500], 0.15),
        color: semantic.warning[500],
      };
    case 'danger':
      return {
        bg: alpha(semantic.danger[500], 0.15),
        color: semantic.danger[500],
      };
    case 'paused':
      return {
        bg: surface[700],
        color: surface[400],
      };
    case 'inactive':
      return {
        bg: surface[700],
        color: surface[500],
      };
    case 'pending':
      return {
        bg: alpha(semantic.info[500], 0.15),
        color: semantic.info[500],
      };
  }
}

// ── Size map ──────────────────────────────────────────────────────────────────

const SIZE_STYLES: Record<
  NonNullable<StatusBadgeProps['size']>,
  { fontSize: string; height: number; px: number }
> = {
  sm: { fontSize: '0.7rem',  height: 20, px: 0.75 },
  md: { fontSize: '0.8rem',  height: 24, px: 1 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBadge({
  variant,
  label,
  size = 'sm',
  icon,
}: StatusBadgeProps) {
  const { bg, color } = getTokens(variant);
  const { fontSize, height, px } = SIZE_STYLES[size];

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height,
        px,
        borderRadius: '999px',
        backgroundColor: bg,
        color,
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {icon && (
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: `calc(${fontSize} * 1.1)`,
          }}
        >
          {icon}
        </Box>
      )}
      {label}
    </Box>
  );
}

export default StatusBadge;
