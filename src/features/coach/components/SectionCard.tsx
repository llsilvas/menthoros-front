import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { Card } from '../../../shared/components/Card';
import { content, surface } from '../../../theme/tokens';

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <Card variant="flat" sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          px: { xs: 1.2, xl: 2 },
          py: { xs: 0.85, xl: 1.1 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, xl: 2 },
          borderBottom: `1px solid ${content.divider}`,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.6875rem', xl: '0.6875rem' },
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            color: surface[400],
          }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: { xs: 1, xl: 1.25 } }}>{children}</Box>
    </Card>
  );
}
