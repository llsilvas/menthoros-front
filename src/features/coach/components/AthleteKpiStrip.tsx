import { content } from '../../../theme/tokens';
import { KpiStrip } from './KpiStrip';
import type { AthleteKpi } from '../adapters/athleteKpiAdapters';

interface AthleteKpiStripProps {
  kpis: AthleteKpi[];
}

/** Faixa de KPIs do atleta selecionado (substitui a grade de `MetricTile compact`). */
export function AthleteKpiStrip({ kpis }: AthleteKpiStripProps) {
  return <KpiStrip items={kpis} testIdPrefix="kpi" sx={{ borderBottom: `1px solid ${content.divider}` }} />;
}
