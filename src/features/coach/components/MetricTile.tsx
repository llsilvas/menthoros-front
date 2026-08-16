import { Box, Typography } from '@mui/material';
import { content, semantic, surface } from '../../../theme/tokens';

interface MetricTileProps {
  label: string;
  value: string;
  delta?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  compact?: boolean;
  highlight?: boolean;
}

export function MetricTile({ label, value, delta, tone = 'neutral', compact = false, highlight = false }: MetricTileProps) {
  const color =
    tone === 'success' ? semantic.success[500] : tone === 'warning' ? semantic.warning[500] : tone === 'danger' ? semantic.danger[500] : surface[50];

  return (
    <Box
      sx={{
        p: compact ? { xs: 0.75, xl: 1 } : 1.2,
        borderRadius: 1.5,
        border: `1px solid ${content.cardBorder}`,
        borderBlockColor: highlight ? `${semantic.warning[500]}66` : content.cardBorder,
        backgroundColor: highlight ? `${semantic.warning[500]}14` : `${surface[0]}06`,
        minHeight: compact ? { xs: 58, xl: 70 } : 78,
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <Typography noWrap sx={{ fontSize: compact ? { xs: '0.6875rem', xl: '0.6875rem' } : '0.6875rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: compact ? 0.25 : 0.35,
          fontSize: compact ? { xs: '1rem', xl: '1.24rem' } : '1.45rem',
          lineHeight: 1.15,
          fontWeight: 700,
          color,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'break-word',
        }}
      >
        {value}
      </Typography>
      {delta ? (
        <Typography noWrap sx={{ mt: compact ? 0.35 : 0.5, fontSize: compact ? { xs: '0.6875rem', xl: '0.7rem' } : '0.75rem', color: surface[400], lineHeight: 1.2 }}>{delta}</Typography>
      ) : null}
    </Box>
  );
}
