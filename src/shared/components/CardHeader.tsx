import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { content, surface } from '../../theme/tokens';

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  divider?: boolean;
}

export function CardHeader({ title, subtitle, icon, action, divider = false }: CardHeaderProps) {
  return (
    <Box
      data-testid="card-header"
      data-divider={divider}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1.5,
        ...(divider
          ? { pb: 1.5, mb: 1.5, borderBottom: `1px solid ${content.divider}` }
          : {}),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ fontSize: '1rem', fontWeight: 600, color: surface[50], lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontSize: '0.75rem', color: surface[400], mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {action ? (
        <Box data-testid="card-header-action" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {action}
        </Box>
      ) : null}
    </Box>
  );
}
