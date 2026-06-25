import { Box, Typography } from '@mui/material';
import { content, semantic, surface } from '../../../../theme/tokens';
import { elevation } from '../../../../shared/design-tokens';
import { DashboardInsightsPanel } from '../DashboardInsightsPanel';
import { DetailMetric } from '../DetailMetric';
import { TrendCard } from '../TrendCard';
import { formatKm, formatPercent } from '../coachInboxHelpers';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { CoachInsights } from '../../../../types/Coach';

interface StatusTabPanelProps {
  dashboardInsights: CoachInsights | null;
  selected: CoachAthleteRow;
  onOpenInsights: () => void;
}

export function StatusTabPanel({ dashboardInsights, selected, onOpenInsights }: StatusTabPanelProps) {
  if (dashboardInsights) {
    return <DashboardInsightsPanel insights={dashboardInsights} onOpenInsights={onOpenInsights} />;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
      <DetailMetric label="Carga aguda" value={formatKm(selected.quickStats.acuteLoad)} subtitle="Ideal: 110-150 km" tone={selected.quickStats.acuteLoad > 120 ? 'warning' : 'success'} />
      <DetailMetric label="Monotonia" value={selected.quickStats.monotony.toFixed(2)} subtitle="Ideal: < 2.0" tone={selected.quickStats.monotony > 1.4 ? 'warning' : 'success'} />
      <DetailMetric label="Fadiga" value={selected.quickStats.fatigue} subtitle="Sinais moderados" tone={selected.quickStats.fatigue === 'Alta' ? 'warning' : 'success'} />
      <DetailMetric label="Recuperação" value={formatPercent(selected.quickStats.recovery)} subtitle="Boa" tone={selected.quickStats.recovery < 80 ? 'warning' : 'success'} />
      <Box
        sx={{
          gridColumn: { xs: '1 / -1', md: '1 / -1' },
          border: `1px solid ${content.cardBorder}`,
          borderRadius: 2,
          backgroundColor: elevation.card,
          p: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400], fontWeight: 700 }}>
            Tendência de carga
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: semantic.success[500], fontWeight: 700 }}>+8% vs semana anterior</Typography>
        </Box>
        <TrendCard data={selected.loadTrend} />
      </Box>
    </Box>
  );
}
