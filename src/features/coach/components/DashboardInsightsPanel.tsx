import { Box, Button, Typography } from '@mui/material';
import { content, surface } from '../../../theme/tokens';
import type { CoachInsights } from '../../../types/Coach';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import { MetricTile } from './MetricTile';
import { SectionCard } from './SectionCard';
import { TrendCard } from './TrendCard';

interface DashboardInsightsPanelProps {
  insights: CoachInsights;
  onOpenInsights: () => void;
}

export function DashboardInsightsPanel({ insights, onOpenInsights }: DashboardInsightsPanelProps) {
  const volumeData = insights.tendenciaCargaSemanal.map((point) => point.volumeTotalKm);
  const totalVolume = Math.round(volumeData.reduce((sum, value) => sum + value, 0));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.2 }}>
        <MetricTile label="Ativos" value={String(insights.kpis.ativos)} delta={`${insights.kpis.totalAtletas} atletas`} tone="success" />
        <MetricTile label="Em atenção" value={String(insights.kpis.emAtencao)} delta="prioridade diária" tone="warning" />
        <MetricTile label="Pausados" value={String(insights.kpis.pausados)} delta="sem carga ativa" />
        <MetricTile label="Treinos da semana" value={String(insights.kpis.treinosPlanejadosSemana)} delta={`${totalVolume} km agregados`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 0.9fr' }, gap: 1.5 }}>
        <SectionCard
          title="Tendência de carga"
          action={
            <Button size="small" sx={{ textTransform: 'none' }} onClick={onOpenInsights}>
              Abrir insights
            </Button>
          }
        >
          {volumeData.length > 0 ? (
            <TrendCard data={volumeData} />
          ) : (
            <Typography sx={{ color: surface[400], fontSize: '0.82rem' }}>Sem dados de carga no período.</Typography>
          )}
        </SectionCard>

        <SectionCard title="Top atletas">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {insights.topAtletas.length > 0 ? (
              insights.topAtletas.slice(0, 4).map((athlete, index) => (
                <Box
                  key={athlete.atletaId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: 1,
                    py: 0.8,
                    borderRadius: 1,
                    border: `1px solid ${content.cardBorder}`,
                    backgroundColor: `${surface[0]}06`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.76rem', color: surface[400], width: 18, flexShrink: 0 }}>
                      {index + 1}
                    </Typography>
                    <CoachAthleteAvatar athlete={{ id: athlete.atletaId, name: athlete.nome }} size="xs" />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: surface[50] }} noWrap>
                      {athlete.nome}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.76rem', color: surface[300], flexShrink: 0 }}>
                    {Math.round(athlete.volumeKm)} km
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: surface[400], fontSize: '0.82rem' }}>Sem ranking de volume no período.</Typography>
            )}
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
}
