import { Box, Typography } from '@mui/material';
import { glassBlockSx, labelSx, monoSx } from './shareCardStyle';

export interface ShareStatProps {
  label: string;
  value: string;
  unit?: string;
}

/** Bloco de vidro com rótulo e valor mono, usado na linha de métricas dos cards. */
export function ShareStat({ label, value, unit }: ShareStatProps) {
  return (
    <Box sx={{ ...glassBlockSx, p: '10px 12px', display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
      <Typography component="span" sx={labelSx}>{label}</Typography>
      <Typography component="span" sx={{ ...monoSx, fontSize: 17, whiteSpace: 'nowrap' }}>
        {value}
        {unit && <Box component="span" sx={{ fontSize: 11, fontWeight: 500, opacity: 0.8 }}> {unit}</Box>}
      </Typography>
    </Box>
  );
}
