import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { backgrounds, content } from '../../../theme/tokens';
import { KpiCell } from './KpiCell';
import type { KpiView } from '../types/Kpi';

interface KpiStripProps {
  items: Array<KpiView & { key: string; icon?: ReactNode }>;
  /** Prefixo do `data-testid` de cada célula: `${testIdPrefix}-${key}`. */
  testIdPrefix: string;
  sx?: SxProps<Theme>;
}

/**
 * Faixa de células de KPI separadas por linha de 1px (o fundo do grid aparece no `gap`). É o padrão
 * do topo do atleta e das métricas do Diagnóstico — um só, para as duas leituras não divergirem.
 */
export function KpiStrip({ items, testIdPrefix, sx }: KpiStripProps) {
  return (
    <Box
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${items.length}, minmax(0, 1fr))` },
          gap: '1px',
          backgroundColor: content.divider,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {items.map((item) => (
        <KpiCell
          key={item.key}
          kpi={item}
          testId={`${testIdPrefix}-${item.key}`}
          icon={item.icon}
          sx={{ backgroundColor: backgrounds.panel, px: { xs: 1.25, lg: 2, xl: 2.5 }, py: { xs: 1.1, lg: 1.5, xl: 1.75 } }}
        />
      ))}
    </Box>
  );
}
