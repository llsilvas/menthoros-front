import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card } from '../../../shared/components/Card';
import { activeTheme } from '../../../theme/activeTheme';

const { primary, surface, overlayWhite } = activeTheme;

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  label,
  value,
  color = primary[500],
  onClick,
}: StatCardProps) {
  return (
    <Card
      variant="glass"
      interactive={!!onClick}
      onClick={onClick}
      sx={{ minWidth: 140, textAlign: 'center' }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 1.5,
          fontSize: 28,
          color,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: '1.75rem',
          color: surface[0],
          mb: 0.5,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: overlayWhite[70],
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Card>
  );
}
