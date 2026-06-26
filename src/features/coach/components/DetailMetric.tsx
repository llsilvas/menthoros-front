import { Box, Typography } from '@mui/material';
import { content, semantic, surface } from '../../../theme/tokens';

interface DetailMetricProps {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export function DetailMetric({ label, value, subtitle, tone = 'neutral' }: DetailMetricProps) {
  const color =
    tone === 'success' ? semantic.success[500] : tone === 'warning' ? semantic.warning[500] : tone === 'danger' ? semantic.danger[500] : surface[50];

  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.5,
        border: `1px solid ${content.cardBorder}`,
        backgroundColor: `${surface[0]}06`,
        minHeight: 60,
      }}
    >
      <Typography sx={{ fontSize: '0.7rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: { xs: '0.95rem', xl: '1.1rem' }, fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography sx={{ mt: 0.5, fontSize: '0.74rem', color: surface[400], lineHeight: 1.3 }}>{subtitle}</Typography>
      ) : null}
    </Box>
  );
}
