import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { glassSx, glassSxHover, transitions } from '../../../theme/tokens';

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
  color = '#b1e92d',
  onClick,
}: StatCardProps) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        minWidth: 140,
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: transitions.default,
        ...glassSx,
        ...(onClick && {
          '&:hover': glassSxHover,
        }),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 1.5,
          color,
          fontSize: 28,
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
          color: '#ffffff',
          mb: 0.5,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
}
