import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { primary, semantic, surface } from '../../../../theme/tokens';
import { DetailMetric } from '../DetailMetric';
import { TrendCard } from '../TrendCard';
import { SectionCard } from '../SectionCard';
import { formatKm, formatPercent } from '../coachInboxHelpers';
import { ACTION_BTN_END_ICON_SX } from '../../../../shared/components/actionButtonSx';
import { getAcuteLoadTone, getMonotonyTone, getStrainZone } from '../../adapters/coachInboxAdapters';
import type { CoachAthleteRow } from '../../types/CoachInbox';
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
    <SectionCard title="Limiares inferidos">
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
    </SectionCard>
  );
}

const PLAN_STATUS_LABEL: Record<CoachAthleteRow['planStatus'], string> = {
  ATRASADO: 'Atrasado',
  NO_PRAZO: 'No prazo',
  CONCLUIDO: 'Concluído',
};

const PLAN_STATUS_COLOR: Record<CoachAthleteRow['planStatus'], string> = {
  ATRASADO: semantic.danger[500],
  NO_PRAZO: primary[500],
  CONCLUIDO: semantic.success[500],
};

interface DiagnosisTabPanelProps {
  selected: CoachAthleteRow;
  limiareisInferidos?: LimiareisInferidosDto | null;
  onOpenPlan: () => void;
}

export function DiagnosisTabPanel({ selected, limiareisInferidos, onOpenPlan }: DiagnosisTabPanelProps) {
  const strainZone = getStrainZone(selected.quickStats.strain);
  const statusColor = PLAN_STATUS_COLOR[selected.planStatus];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
      <SectionCard
        title="Próximo treino"
        action={
          <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} sx={{ ...ACTION_BTN_END_ICON_SX, px: { xs: 0.75, xl: 1 } }} onClick={onOpenPlan}>
            Abrir plano
          </Button>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '0.92rem', lg: '1rem', xl: '1.1rem' }, fontWeight: 700, color: surface[50] }}>{selected.nextWorkout.title}</Typography>
            <Typography sx={{ fontSize: { xs: '0.7rem', lg: '0.8rem', xl: '0.86rem' }, color: surface[400], mt: 0.2 }}>
              {selected.nextWorkout.when} · {selected.nextWorkout.duration} - {selected.nextWorkout.distance}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={PLAN_STATUS_LABEL[selected.planStatus]}
            sx={{ bgcolor: `${statusColor}16`, color: statusColor, border: `1px solid ${statusColor}44`, fontWeight: 700 }}
          />
        </Box>
      </SectionCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
        <DetailMetric label="Carga aguda" value={formatKm(selected.quickStats.acuteLoad)} subtitle="Ideal: 110-150 km" tone={getAcuteLoadTone(selected.quickStats.acuteLoad)} />
        <DetailMetric label="Monotonia" value={selected.quickStats.monotony.toFixed(2)} subtitle="Ideal: < 2.0" tone={getMonotonyTone(selected.quickStats.monotony)} />
        <DetailMetric
          label="Strain"
          value={selected.quickStats.strain != null ? String(selected.quickStats.strain) : '—'}
          subtitle={strainZone.label}
          tone={strainZone.tone}
        />
        <DetailMetric label="Recuperação" value={formatPercent(selected.quickStats.recovery)} subtitle="Boa" tone={selected.quickStats.recovery < 80 ? 'warning' : 'success'} />
      </Box>

      <SectionCard title="Tendência de carga">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: selected.loadDelta >= 0 ? semantic.success[500] : semantic.danger[500], fontWeight: 700 }}>
            {selected.loadDelta >= 0 ? '+' : ''}{selected.loadDelta}% vs semana anterior
          </Typography>
        </Box>
        <TrendCard data={selected.loadTrend} />
      </SectionCard>

      <SectionCard title="Adesão nas últimas semanas">
        {selected.adherenceTrend.length === 0 ? (
          <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>Sem dados de adesão.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
            {selected.adherenceTrend.map((value, index) => (
              <Box key={`${selected.id}-adherence-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Typography sx={{ width: 40, fontSize: '0.64rem', color: surface[400] }}>S{index + 1}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={value}
                  sx={{
                    flex: 1,
                    height: 5,
                    borderRadius: 999,
                    bgcolor: `${surface[0]}14`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: value >= 85 ? semantic.success[500] : value >= 70 ? primary[500] : semantic.warning[500],
                      borderRadius: 999,
                    },
                  }}
                />
                <Typography sx={{ width: 36, textAlign: 'right', fontSize: '0.64rem', color: surface[200], fontWeight: 700 }}>{value}%</Typography>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      {limiareisInferidos && <LimiareisCard limiares={limiareisInferidos} />}

      <SectionCard title="Sinais de atenção">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: { xs: '0.78rem', lg: '0.85rem', xl: '0.9rem' }, color: surface[100], lineHeight: 1.45 }}>{selected.notes}</Typography>
          {selected.suggestedActions.map((action) => (
            <Box key={`${selected.id}-${action}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
              <Typography sx={{ fontSize: '0.84rem', color: surface[200] }}>{action}</Typography>
            </Box>
          ))}
        </Box>
      </SectionCard>
    </Box>
  );
}
