import { Box, Typography } from '@mui/material';
import { content, semantic, surface } from '../../../../theme/tokens';
import { elevation } from '../../../../shared/design-tokens';
import { DashboardInsightsPanel } from '../DashboardInsightsPanel';
import { DetailMetric } from '../DetailMetric';
import { TrendCard } from '../TrendCard';
import { formatKm, formatPercent } from '../coachInboxHelpers';
import { formFromTSB, formVariantLabel, getTsbFormaTone } from '../../types/AthleteForm';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { CoachInsights } from '../../../../types/Coach';
import type { LimiareisInferidosDto } from '../../../../types/AtletaPerfilCoach';

const CONFIANCA_LABEL: Record<'ALTA' | 'MEDIA' | 'BAIXA', string> = {
  ALTA:  'Alta confiança',
  MEDIA: 'Média confiança',
  BAIXA: 'Baixa confiança',
};

const CONFIANCA_COLOR: Record<'ALTA' | 'MEDIA' | 'BAIXA', string> = {
  ALTA:  semantic.success[500],
  MEDIA: semantic.warning[500],
  BAIXA: surface[400],
};

function LimiareisCard({ limiares }: { limiares: LimiareisInferidosDto }) {
  const temFc = limiares.fcLimiarEstimado != null;
  const temPace = limiares.paceLimiarEstimadoFormatado != null;
  if (!temFc && !temPace) return null;
  return (
    <Box
      sx={{
        gridColumn: { xs: '1 / -1', md: '1 / -1' },
        border: `1px solid ${content.cardBorder}`,
        borderRadius: 2,
        backgroundColor: elevation.card,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400], fontWeight: 700 }}>
        Limiares inferidos
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {temFc && (
          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: surface[400] }}>FC limiar</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: surface[50] }}>
              {limiares.fcLimiarEstimado} bpm
            </Typography>
            {limiares.confiancaInferenciaFc && (
              <Typography sx={{ fontSize: '0.68rem', color: CONFIANCA_COLOR[limiares.confiancaInferenciaFc] }}>
                {CONFIANCA_LABEL[limiares.confiancaInferenciaFc]}
              </Typography>
            )}
          </Box>
        )}
        {temPace && (
          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: surface[400] }}>Pace limiar</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: surface[50] }}>
              {limiares.paceLimiarEstimadoFormatado} /km
            </Typography>
            {limiares.confiancaInferenciaPace && (
              <Typography sx={{ fontSize: '0.68rem', color: CONFIANCA_COLOR[limiares.confiancaInferenciaPace] }}>
                {CONFIANCA_LABEL[limiares.confiancaInferenciaPace]}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface StatusTabPanelProps {
  dashboardInsights: CoachInsights | null;
  selected: CoachAthleteRow;
  limiareisInferidos?: LimiareisInferidosDto | null;
  onOpenInsights: () => void;
}

export function StatusTabPanel({ dashboardInsights, selected, limiareisInferidos, onOpenInsights }: StatusTabPanelProps) {
  if (dashboardInsights) {
    return <DashboardInsightsPanel insights={dashboardInsights} onOpenInsights={onOpenInsights} />;
  }

  const tsbForma = selected.quickStats.tsb != null ? formFromTSB(selected.quickStats.tsb) : null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
      <DetailMetric label="Carga aguda" value={formatKm(selected.quickStats.acuteLoad)} subtitle="Ideal: 110-150 km" tone={selected.quickStats.acuteLoad > 120 ? 'warning' : 'success'} />
      <DetailMetric label="Monotonia" value={selected.quickStats.monotony.toFixed(2)} subtitle="Ideal: < 2.0" tone={selected.quickStats.monotony > 1.4 ? 'warning' : 'success'} />
      <DetailMetric
        label="Forma"
        value={tsbForma != null ? formVariantLabel[tsbForma] : '—'}
        subtitle={selected.quickStats.tsb != null ? `TSB ${selected.quickStats.tsb}` : 'TSB não disponível'}
        tone={tsbForma != null ? getTsbFormaTone(tsbForma) : 'neutral'}
      />
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
          <Typography sx={{ fontSize: '0.8rem', color: selected.loadDelta >= 0 ? semantic.success[500] : semantic.danger[500], fontWeight: 700 }}>
            {selected.loadDelta >= 0 ? '+' : ''}{selected.loadDelta}% vs semana anterior
          </Typography>
        </Box>
        <TrendCard data={selected.loadTrend} />
      </Box>
      {limiareisInferidos && <LimiareisCard limiares={limiareisInferidos} />}
    </Box>
  );
}
