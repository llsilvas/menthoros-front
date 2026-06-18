import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { Insights as InsightsIcon } from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { primary, surface, categorical, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens/elevation';

import { KPICard } from '../../../shared/components/KPICard';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { useCoachInsights } from '../../../hooks/useCoachInsights';
import type { CoachInsights } from '../../../types/Coach';

// ── Chart token constants ──────────────────────────────────────────────────────

const CHART_GRID_STROKE    = `${surface[0]}14`; // white 8%
const CHART_AXIS_STROKE    = surface[400];
const CHART_TOOLTIP_BG     = surface[700];
const CHART_TOOLTIP_COLOR  = surface[50];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        color:         surface[400],
        fontWeight:    600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontSize:      '0.7rem',
        mb:            1.5,
      }}
    >
      {children}
    </Typography>
  );
}

/** Placeholder pontilhado para recursos sem fonte de dado ainda (CA6). */
function PlaceholderCard({ children }: { children: string }) {
  return (
    <Box
      sx={{
        p:            2.5,
        borderRadius: 1,
        border:       `1px dashed ${surface[700]}`,
        color:        surface[500],
        fontSize:     '0.875rem',
        textAlign:    'center',
      }}
    >
      {children}
    </Box>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function TabVisaoGeral({ insights }: { insights: CoachInsights }) {
  const { kpis, topAtletas } = insights;
  const volumeTotal = useMemo(
    () => Math.round(insights.tendenciaCargaSemanal.reduce((s, p) => s + p.volumeTotalKm, 0)),
    [insights.tendenciaCargaSemanal],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI grid — só métricas reais do DTO */}
      <Box>
        <SectionHeading>Resumo do período</SectionHeading>
        <Box
          sx={{
            display:             'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap:                 2,
          }}
        >
          <KPICard label="Atletas ativos" value={kpis.ativos} unit={`/ ${kpis.totalAtletas}`} />
          <KPICard label="Em atenção" value={kpis.emAtencao} emphasis="normal" />
          <KPICard label="Pausados" value={kpis.pausados} emphasis="normal" />
          <KPICard label="Treinos planejados (semana)" value={kpis.treinosPlanejadosSemana} emphasis="normal" />
          <KPICard label="Volume total" value={volumeTotal} unit="km" />
        </Box>
      </Box>

      {/* Recursos sem fonte ainda — sinalizados, não fabricados (CA6/R2) */}
      <PlaceholderCard>
        Adesão ao plano, alertas e validações pendentes chegam com as próximas entregas
        (revisão semanal, fila de atenção e inbox de sugestões)
      </PlaceholderCard>

      {/* Top atletas por volume (real) */}
      <Box>
        <SectionHeading>Top atletas por volume</SectionHeading>
        {topAtletas.length === 0 ? (
          <PlaceholderCard>Sem volume registrado no período</PlaceholderCard>
        ) : (
          <Box
            sx={{
              backgroundColor: elevation.card,
              border:          `1px solid ${content.cardBorder}`,
              borderRadius:    1,
              overflow:        'hidden',
            }}
          >
            {topAtletas.map((athlete, idx) => (
              <Box
                key={athlete.atletaId}
                sx={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        1.5,
                  px:         2,
                  py:         1.25,
                  borderTop:  idx > 0 ? `1px solid ${content.divider}` : undefined,
                }}
              >
                <CoachAthleteAvatar athlete={{ id: athlete.atletaId, name: athlete.nome }} size="xs" />
                <Typography sx={{ flex: 1, fontSize: '0.875rem', color: surface[50], fontWeight: 500 }}>
                  {athlete.nome}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.8rem', color: surface[300], fontVariantNumeric: 'tabular-nums' }}
                >
                  {Math.round(athlete.volumeKm)} km
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function TabCarga({ insights }: { insights: CoachInsights }) {
  const data = insights.tendenciaCargaSemanal;
  const barFill = `${primary[500]}4D`;

  if (data.length === 0) {
    return <PlaceholderCard>Sem dados de carga no período</PlaceholderCard>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <SectionHeading>Carga (TSS) total por semana</SectionHeading>
        <Box
          sx={{
            backgroundColor: elevation.card,
            border:          `1px solid ${content.cardBorder}`,
            borderRadius:    1,
            p:               2,
          }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="semana" stroke={CHART_AXIS_STROKE} tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }} />
              <YAxis stroke={CHART_AXIS_STROKE} tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: CHART_TOOLTIP_BG, border: 'none', borderRadius: 4, color: CHART_TOOLTIP_COLOR }}
                labelStyle={{ color: CHART_TOOLTIP_COLOR }}
                formatter={(value) => [`${value} TSS`, 'Carga']}
              />
              <Line
                type="monotone"
                dataKey="tssTotal"
                name="TSS total"
                stroke={categorical.cat1}
                strokeWidth={2.5}
                dot={{ fill: categorical.cat1, r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box>
        <SectionHeading>Volume total por semana (km)</SectionHeading>
        <Box
          sx={{
            backgroundColor: elevation.card,
            border:          `1px solid ${content.cardBorder}`,
            borderRadius:    1,
            p:               2,
          }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="semana" stroke={CHART_AXIS_STROKE} tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }} />
              <YAxis stroke={CHART_AXIS_STROKE} tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: CHART_TOOLTIP_BG, border: 'none', borderRadius: 4, color: CHART_TOOLTIP_COLOR }}
                labelStyle={{ color: CHART_TOOLTIP_COLOR }}
                formatter={(value) => [`${value} km`, 'Volume']}
              />
              <Bar
                dataKey="volumeTotalKm"
                name="Volume (km)"
                fill={barFill}
                stroke={primary[500]}
                strokeWidth={1}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}

function TabPerformance() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PlaceholderCard>Histórico de performance e simulações de prova em breve</PlaceholderCard>
    </Box>
  );
}

function TabSaude() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PlaceholderCard>Integração com HRV e dados de sono em breve</PlaceholderCard>
    </Box>
  );
}

function TabComparativos() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PlaceholderCard>Comparação entre grupos de atletas em breve</PlaceholderCard>
    </Box>
  );
}

const TAB_LABELS = ['Visão geral', 'Carga', 'Performance', 'Saúde', 'Comparativos'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachInsightsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { insights, loading, error, fetchInsights } = useCoachInsights();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  function renderPanel() {
    if (!insights) return null;
    switch (activeTab) {
      case 0: return <TabVisaoGeral insights={insights} />;
      case 1: return <TabCarga insights={insights} />;
      case 2: return <TabPerformance />;
      case 3: return <TabSaude />;
      case 4: return <TabComparativos />;
      default: return null;
    }
  }

  return (
    <Box
      sx={{
        height:        '100%',
        display:       'flex',
        flexDirection: 'column',
        bgcolor:       elevation.base,
        overflow:      'hidden',
      }}
    >
      {/* ── Page header ── */}
      <Box sx={{ px: 3, pt: 3, pb: 0, flexShrink: 0, borderBottom: `1px solid ${content.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InsightsIcon sx={{ color: primary[500], fontSize: 26 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50], lineHeight: 1.2 }}
              >
                Insights
              </Typography>
              <Typography variant="body2" sx={{ color: surface[400] }}>
                Últimas 12 semanas
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { backgroundColor: primary[500] },
            '& .MuiTab-root': {
              color:      surface[500],
              fontSize:   '0.8rem',
              fontWeight: 500,
              minHeight:  40,
              py:         0,
              '&.Mui-selected': { color: primary[500] },
            },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>

      {/* ── Conteúdo: erro / carregando / painel ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => fetchInsights()}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar os insights da assessoria.
          </Alert>
        ) : loading && !insights ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderPanel()
        )}
      </Box>
    </Box>
  );
}
