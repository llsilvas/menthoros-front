import { content } from '../../../theme/tokens';
import { KpiStrip } from './KpiStrip';
import type { AthleteKpi } from '../adapters/athleteKpiAdapters';

interface AthleteKpiStripProps {
  kpis: AthleteKpi[];
}

/**
 * Faixa de KPIs do atleta selecionado, em uma linha: o coach lê de relance e segue para o
 * Diagnóstico. A base de cada número fica no `title` e no leitor de tela.
 */
export function AthleteKpiStrip({ kpis }: AthleteKpiStripProps) {
  return <KpiStrip items={kpis} testIdPrefix="kpi" testId="inbox-kpi-faixa" dense sx={{ borderBottom: `1px solid ${content.divider}` }} />;
}
