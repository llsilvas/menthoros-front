import { Box } from '@mui/material';
import { backgrounds, content } from '../../../theme/tokens';
import { KpiCell } from './KpiCell';
import type { AthleteKpi } from '../adapters/athleteKpiAdapters';

interface AthleteKpiStripProps {
  kpis: AthleteKpi[];
}

/** Faixa de KPIs do atleta selecionado (substitui a grade de `MetricTile compact`). */
export function AthleteKpiStrip({ kpis }: AthleteKpiStripProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${kpis.length}, minmax(0, 1fr))` },
        gap: '1px',
        backgroundColor: content.divider,
        borderBottom: `1px solid ${content.divider}`,
      }}
    >
      {kpis.map((kpi) => (
        <KpiCell
          key={kpi.key}
          kpi={kpi}
          testId={`kpi-${kpi.key}`}
          sx={{ backgroundColor: backgrounds.panel, px: { xs: 1.25, lg: 2, xl: 2.5 }, py: { xs: 1.1, lg: 1.5, xl: 1.75 } }}
        />
      ))}
    </Box>
  );
}
