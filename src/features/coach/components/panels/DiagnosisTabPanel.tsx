import { lazy, Suspense, useMemo, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { parseISO } from 'date-fns';
import { content, primary, semantic, surface } from '../../../../theme/tokens';
import { KpiStrip } from '../KpiStrip';
import { EmptyMetricState } from '../EmptyMetricState';
import { AdherenceToneLegend, WeeklyAdherenceLoadChart } from '../WeeklyAdherenceLoadChart';
import { DiagnosisCard } from '../DiagnosisCard';
import { PmcChartControls } from '../../../athlete/components/PmcChartControls';
import type { PMCViewMode } from '../../../athlete/components/PmcChartControls';
import { AIInsightCard } from '../AIInsightCard';
import { PmcBackfillNotice } from '../PmcBackfillNotice';
import { usePmcBackfillNotice } from '../../../../hooks/usePmcBackfillNotice';
import type { CoachAttentionItem } from '../../../../types/Coach';
import { ACTION_BTN_END_ICON_SX } from '../../../../shared/components/actionButtonSx';
import { buildDiagnosisMetrics } from '../../adapters/diagnosisMetricsAdapters';
import { DIAGNOSIS_WEEKS } from '../../adapters/diagnosisChartsAdapters';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { LimiareisInferidosDto } from '../../../../types/AtletaPerfilCoach';
import type { PMCDataPoint, PMCGap, PMCRange } from '../../../athlete/components/PMCChart';

// Lazy como nas demais superfícies: mantém o recharts fora do chunk principal. Os controles do PMC
// vivem num arquivo sem recharts, para o cabeçalho do card não puxar o gráfico junto.
const PMCChart = lazy(() => import('../../../athlete/components/PMCChart'));

const PMC_SUBTITLE: Record<PMCViewMode, string> = {
  advanced: 'Condicionamento, cansaço e forma diários',
  simple: 'Forma diária (TSB), colorida pela faixa',
};

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
    <DiagnosisCard title="Limiares inferidos" subtitle="Estimados pelos treinos dos últimos 30 dias">
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
              {/* O backend já formata com a unidade ("4:35/km"). */}
              {limiares.paceLimiarEstimadoFormatado}
            </Typography>
            {limiares.confiancaInferenciaPace && (
              <Typography sx={{ fontSize: '0.6875rem', color: CONFIANCA_COLOR[limiares.confiancaInferenciaPace] }}>
                {CONFIANCA_LABEL[limiares.confiancaInferenciaPace]}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </DiagnosisCard>
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
  const metrics = buildDiagnosisMetrics(selected);
  const statusColor = PLAN_STATUS_COLOR[selected.planStatus];
  const [pmcRange, setPmcRange] = useState<PMCRange>('12w');
  const [pmcMode, setPmcMode] = useState<PMCViewMode>('advanced');
  const kmMode = selected.weeklyDiagnosis.some((w) => w.distanceKm != null);
  const weeksSubtitle = `Últimas ${DIAGNOSIS_WEEKS} semanas · acima: adesão (treinos feitos / planejados) · abaixo: carga em ${kmMode ? 'km' : 'TSS'}`;
  const { dismissed: pmcNoticeDismissed, dismiss: dismissPmcNotice } = usePmcBackfillNotice();
  const pmcGaps = useMemo<PMCGap[]>(
    () => selected.dataGaps.map((g) => ({ start: parseISO(g.start), end: parseISO(g.end) })),
    [selected.dataGaps],
  );

  /*
    Ordem: situação → evidência → explicação → ação → detalhe.
      1. Sinais de atenção       — o porquê, que é como o coach decide
      2. Métricas                — evidência imediata
      3. Adesão e carga/semana   — evidência dos motivos de engajamento (ADERENCIA/INATIVIDADE), os
                                   mais comuns na fila; adesão e carga no MESMO eixo semanal
      4. Forma (PMC)             — evidência de médio prazo
      5. Próximo treino          — ação/contexto, depois da evidência que a justifica
      6. Limiares                — detalhe de referência
  */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
      {/*
        O insight vem PRIMEIRO. A auditoria (UX-002) encontrou o diagnóstico enterrado abaixo de
        todas as métricas e gráficos: o coach decide pelo "porquê", e o número é evidência do
        insight — não o contrário. A ordem está travada por teste.
      */}
      <DiagnosisCard
        title="Sinais de atenção"
        subtitle={attentionItem ? 'Por que este atleta está na fila · evidência e ação sugerida' : 'Nenhum sinal ativo na fila de atenção · resumo do perfil'}
      >
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
      </DiagnosisCard>



      {selected.quickStats.hasWindowData ? (
        /*
          Sem faixa "ideal" (UX-005): um intervalo fixo, igual para todo atleta, não é referência.
          O tom sinaliza o estado, também por ícone; a linha de apoio diz a base de cada número.
          Mesma faixa do topo do atleta: células planas separadas por linha, não cards soltos.
        */
        <KpiStrip items={metrics} testIdPrefix="metric" sx={{ border: `1px solid ${content.divider}` }} />
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

      {/*
        Substitui "Adesão nas últimas semanas" (barras S1…Sn sem data) e "Tendência de carga" (que
        plotava CTL diário — condicionamento — com tooltip "Ponto N · Valor").
      */}
      <DiagnosisCard
        title="Adesão e carga por semana"
        subtitle={weeksSubtitle}
        action={selected.adherenceAvailable && selected.weeklyDiagnosis.some((w) => w.adherence != null) ? <AdherenceToneLegend /> : undefined}
      >
        <WeeklyAdherenceLoadChart
          weeks={selected.weeklyDiagnosis}
          gaps={selected.dataGaps}
          adherenceAvailable={selected.adherenceAvailable}
          pmcAvailable={selected.pmcAvailable}
        />
      </DiagnosisCard>

      <DiagnosisCard
        title="Forma (PMC)"
        subtitle={PMC_SUBTITLE[pmcMode]}
        action={
          selected.pmcAvailable && pmc.length > 0 ? (
            <PmcChartControls mode={pmcMode} onModeChange={setPmcMode} range={pmcRange} onRangeChange={setPmcRange} />
          ) : undefined
        }
      >
        {pmc.length > 0 && !pmcNoticeDismissed && <PmcBackfillNotice onDismiss={dismissPmcNotice} />}
        {!selected.pmcAvailable ? (
          <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>Dado indisponível</Typography>
        ) : pmc.length === 0 ? (
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
            <PMCChart data={pmc} range={pmcRange} mode={pmcMode} gaps={pmcGaps} simpleMetric="forma" embedded />
          </Suspense>
        )}
      </DiagnosisCard>



      <DiagnosisCard
        title="Próximo treino"
        subtitle="Primeiro treino pendente do plano vigente, a partir de hoje"
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
      </DiagnosisCard>

      {limiareisInferidos && <LimiareisCard limiares={limiareisInferidos} />}

    </Box>
  );
}
