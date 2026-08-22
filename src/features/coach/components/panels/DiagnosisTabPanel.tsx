import { lazy, Suspense, useState } from 'react';
import { Box, Button, Chip, CircularProgress, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { primary, semantic, surface } from '../../../../theme/tokens';
import { DetailMetric } from '../DetailMetric';
import { TrendCard } from '../TrendCard';
import { SectionCard } from '../SectionCard';
import { EmptyMetricState } from '../EmptyMetricState';
import { AIInsightCard } from '../AIInsightCard';
import { PmcBackfillNotice } from '../PmcBackfillNotice';
import { usePmcBackfillNotice } from '../../../../hooks/usePmcBackfillNotice';
import type { CoachAttentionItem } from '../../../../types/Coach';
import { formatKm, formatPercent } from '../coachInboxHelpers';
import { ACTION_BTN_END_ICON_SX } from '../../../../shared/components/actionButtonSx';
import { getAcuteLoadTone, getMonotonyTone, getStrainZone } from '../../adapters/coachInboxAdapters';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { LimiareisInferidosDto } from '../../../../types/AtletaPerfilCoach';
import type { PMCDataPoint, PMCRange } from '../../../athlete/components/PMCChart';

// Lazy como nas demais superfícies: mantém o recharts fora do chunk principal.
const PMCChart = lazy(() => import('../../../athlete/components/PMCChart'));

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
              <Typography sx={{ fontSize: '0.6875rem', color: CONFIANCA_COLOR[limiares.confiancaInferenciaFc] }}>
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
              <Typography sx={{ fontSize: '0.6875rem', color: CONFIANCA_COLOR[limiares.confiancaInferenciaPace] }}>
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
  /** Item bruto da fila de atenção do atleta, quando ele está nela. */
  attentionItem?: CoachAttentionItem | null;
  /** Dias sem treinar (inatividade) ou idade do alerta. */
  attentionRecencyDays?: number | null;
  limiareisInferidos?: LimiareisInferidosDto | null;
  /** Série PMC (CTL/ATL/TSB) do atleta selecionado, já mapeada do perfil. */
  pmc: PMCDataPoint[];
  onOpenPlan: () => void;
}

export function DiagnosisTabPanel({ selected, attentionItem, attentionRecencyDays = null, limiareisInferidos, pmc, onOpenPlan }: DiagnosisTabPanelProps) {
  const strainZone = getStrainZone(selected.quickStats.strain);
  const statusColor = PLAN_STATUS_COLOR[selected.planStatus];
  const [pmcRange, setPmcRange] = useState<PMCRange>('12w');
  const { dismissed: pmcNoticeDismissed, dismiss: dismissPmcNotice } = usePmcBackfillNotice();

  /*
    Ordem: situação → evidência → explicação → ação → detalhe.
      1. Sinais de atenção  — o porquê, que é como o coach decide
      2. Métricas           — evidência imediata
      3. Adesão             — evidência dos motivos de engajamento (ADERENCIA/INATIVIDADE), os mais
                              comuns na fila; estava em 6º, atrás de dois charts de carga
      4-5. Tendências       — evidência de médio prazo
      6. Próximo treino     — ação/contexto, depois da evidência que a justifica
      7. Limiares           — detalhe de referência
  */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
      {/*
        O insight vem PRIMEIRO. A auditoria (UX-002) encontrou o diagnóstico enterrado abaixo de
        todas as métricas e gráficos: o coach decide pelo "porquê", e o número é evidência do
        insight — não o contrário. A ordem está travada por teste.
      */}
      <SectionCard title="Sinais de atenção">
        {attentionItem ? (
          /*
            Com item da fila de atenção, o insight vem ESTRUTURADO. O DTO já trazia motivo,
            evidência, `rationale` e `sourceRules`; nada disso era renderizado separado — chegava
            amassado no `notes`, um texto livre concatenado dos avisos do perfil.
          */
          <AIInsightCard item={attentionItem} recencyDays={attentionRecencyDays} />
        ) : (
          // Sem sinal ativo não há o que estruturar: cai no resumo do perfil.
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: { xs: '0.78rem', lg: '0.85rem', xl: '0.9rem' }, color: surface[100], lineHeight: 1.45 }}>{selected.notes}</Typography>
            {selected.suggestedActions.map((action) => (
              <Box key={`${selected.id}-${action}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
                <Typography sx={{ fontSize: '0.84rem', color: surface[200] }}>{action}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>



      {selected.quickStats.hasWindowData ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
          {/*
            Sem faixa "ideal" (UX-005). "Ideal: 110-150 km" e "Ideal: < 2.0" eram fixos e iguais para
            todo atleta — o mesmo intervalo para um iniciante de 20 km/semana e para um maratonista.
            Referência que ignora o atleta não é referência: é ruído com aparência de precisão. O
            `tone` continua sinalizando o estado, agora também por ícone (task 2.4).
          */}
          <DetailMetric label="Carga aguda" value={formatKm(selected.quickStats.acuteLoad)} tone={getAcuteLoadTone(selected.quickStats.acuteLoad)} />
          <DetailMetric label="Monotonia" value={selected.quickStats.monotony.toFixed(2)} tone={getMonotonyTone(selected.quickStats.monotony)} />
          <DetailMetric
            label="Strain"
            value={selected.quickStats.strain != null ? String(selected.quickStats.strain) : '—'}
            subtitle={strainZone.label}
            tone={strainZone.tone}
          />
          {/*
            O subtítulo era a string fixa "Boa" — afirmada inclusive quando o próprio `tone` marcava
            atenção. Um rótulo que contradiz o dado ao lado é pior que rótulo nenhum.
          */}
          <DetailMetric
            label="Recuperação"
            value={formatPercent(selected.quickStats.recovery)}
            tone={selected.quickStats.recovery < 80 ? 'warning' : 'success'}
          />
        </Box>
      ) : (
        /*
          Sem série na janela, os números desta grade são fallback: carga cai para 0 e monotonia
          para 1.00, ambos em faixa "adequada". Exibi-los seria afirmar que o atleta está bem
          quando o que se sabe é que não há dado nenhum.
        */
        <EmptyMetricState
          mensagem="Sem treinos registrados na janela analisada — os indicadores aparecem com o primeiro treino sincronizado."
          proximoPasso="Confira a integração do atleta ou registre um treino manualmente."
        />
      )}

      <SectionCard title="Adesão nas últimas semanas">
        {selected.adherenceTrend.length === 0 ? (
          <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>Sem dados de adesão.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
            {selected.adherenceTrend.map((value, index) => (
              <Box key={`${selected.id}-adherence-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Typography sx={{ width: 40, fontSize: '0.6875rem', color: surface[400] }}>S{index + 1}</Typography>
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
                <Typography sx={{ width: 36, textAlign: 'right', fontSize: '0.6875rem', color: surface[200], fontWeight: 700 }}>{value}%</Typography>
              </Box>
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Tendência de carga">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: selected.loadDelta >= 0 ? semantic.success[500] : semantic.danger[500], fontWeight: 700 }}>
            {selected.loadDelta >= 0 ? '+' : ''}{selected.loadDelta}% vs semana anterior
          </Typography>
        </Box>
        <TrendCard data={selected.loadTrend} />
      </SectionCard>

      <SectionCard title="Tendência de forma (PMC)">
        {pmc.length > 0 && !pmcNoticeDismissed && <PmcBackfillNotice onDismiss={dismissPmcNotice} />}
        {pmc.length === 0 ? (
          <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>
            Sem histórico de PMC para exibir ainda.
          </Typography>
        ) : (
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            }
          >
            <PMCChart data={pmc} range={pmcRange} defaultMode="advanced" onRangeChange={setPmcRange} />
          </Suspense>
        )}
      </SectionCard>



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

      {limiareisInferidos && <LimiareisCard limiares={limiareisInferidos} />}

    </Box>
  );
}
