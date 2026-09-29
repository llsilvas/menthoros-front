import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { semantic, surface } from '../../../theme/tokens';
import { marcadorDe } from './toneMarker';
import type { KpiView } from '../adapters/athleteKpiAdapters';
import type { MetricTone } from '../../../types/FaixaTsb';

interface KpiCellProps {
  kpi: KpiView;
  testId: string;
  sx?: SxProps<Theme>;
}

const TONE_COLOR: Record<MetricTone, string> = {
  success: semantic.success[500],
  warning: semantic.warning[500],
  danger: semantic.danger[500],
  neutral: surface[50],
};

/**
 * Célula de KPI: rótulo · qualificador, valor com marcador de tom, selo opcional e linha de apoio
 * em até 2 linhas. A linha de apoio carrega a base do número ou o motivo de não haver um — texto
 * que o tile compacto, de uma linha, cortava.
 */
export function KpiCell({ kpi, testId, sx }: KpiCellProps) {
  const color = TONE_COLOR[kpi.tone];
  const marcador = marcadorDe(kpi.tone);
  return (
    <Box data-testid={testId} sx={[{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Typography sx={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400] }}>
        <span>{kpi.label}</span>
        {kpi.qualifier ? <Box component="span" sx={{ color: surface[500] }}> · {kpi.qualifier}</Box> : null}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: { xs: '1.25rem', xl: '1.5rem' }, fontWeight: 700, lineHeight: 1.15, color, fontVariantNumeric: 'tabular-nums' }}>
          {marcador ? <marcador.Icone titleAccess={marcador.rotulo} sx={{ fontSize: '0.85em', mr: 0.5, verticalAlign: '-0.1em', color }} /> : null}
          {kpi.value}
        </Typography>
        {kpi.badge ? (
          <Box
            component="span"
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: semantic.warning[500],
              border: `1px dashed ${semantic.warning[700]}`,
              borderRadius: 999,
              px: 1,
              py: 0.15,
              whiteSpace: 'nowrap',
            }}
          >
            {kpi.badge}
          </Box>
        ) : null}
      </Box>
      <Typography
        sx={{
          fontSize: '0.75rem',
          lineHeight: 1.35,
          color: surface[400],
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textWrap: 'pretty',
        }}
      >
        {kpi.detail}
      </Typography>
    </Box>
  );
}
