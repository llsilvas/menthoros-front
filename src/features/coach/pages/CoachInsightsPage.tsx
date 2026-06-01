import { useState } from 'react';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import { Insights as InsightsIcon } from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { primary, surface, categorical, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens/elevation';
import { content } from '../../../theme/tokens';

import { KPICard } from '../../../shared/components/KPICard';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { PhaseIndicator } from '../../../shared/components/PhaseIndicator';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import type { TrainingPhase } from '../../../shared/components/PhaseIndicator';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_INSIGHTS = {
  period: { label: 'Últimas 4 semanas', from: '2026-05-04', to: '2026-06-01' },
  kpis: {
    totalAthletes: 6,
    activeAthletes: 5,
    avgCTL: 74,
    avgTSB: 3,
    totalVolumeKm: 1240,
    adherenceRate: 87,
    pendingValidations: 2,
    alertsCount: 1,
  },
  weeklyLoad: [
    { week: 'Sem 1', avgCTL: 68, avgATL: 72, totalKm: 290 },
    { week: 'Sem 2', avgCTL: 70, avgATL: 75, totalKm: 310 },
    { week: 'Sem 3', avgCTL: 73, avgATL: 80, totalKm: 330 },
    { week: 'Sem 4', avgCTL: 74, avgATL: 78, totalKm: 310 },
  ],
  topAthletes: [
    { id: '3', name: 'Rafael Costa',  ctl: 95,  tsb: 25,  phase: 'TAPER' as TrainingPhase, status: 'active'  as StatusBadgeVariant },
    { id: '5', name: 'Pedro Alves',   ctl: 110, tsb: -35, phase: 'BUILD' as TrainingPhase, status: 'danger'  as StatusBadgeVariant },
    { id: '1', name: 'Carlos Mendes', ctl: 82,  tsb: -8,  phase: 'BUILD' as TrainingPhase, status: 'warning' as StatusBadgeVariant },
  ],
  sparklineData: {
    ctl:       [65, 67, 70, 71, 73, 74],
    volume:    [250, 270, 310, 330, 310, 290],
    adherence: [82, 85, 88, 90, 87, 87],
  },
} as const;

// ── Chart token constants ──────────────────────────────────────────────────────

const CHART_GRID_STROKE    = 'rgba(255, 255, 255, 0.08)';
const CHART_AXIS_STROKE    = surface[400];
const CHART_TOOLTIP_BG     = surface[700];
const CHART_TOOLTIP_COLOR  = surface[50];

// ── Sub-components ────────────────────────────────────────────────────────────

/** Section heading inside a tab panel */
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

/** Styled placeholder card for upcoming features */
function PlaceholderCard({ children }: { children: string }) {
  return (
    <Box
      sx={{
        p:             2.5,
        borderRadius:  1,
        border:        `1px dashed ${surface[700]}`,
        color:         surface[500],
        fontSize:      '0.875rem',
        textAlign:     'center',
      }}
    >
      {children}
    </Box>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function TabVisaoGeral() {
  const { kpis, topAthletes, sparklineData } = MOCK_INSIGHTS;

  const athletesNeedingAttention = topAthletes.filter(
    (a) => a.status !== 'active',
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI grid */}
      <Box>
        <SectionHeading>Resumo do período</SectionHeading>
        <Box
          sx={{
            display:             'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap:                 2,
          }}
        >
          <KPICard
            label="Atletas ativos"
            value={kpis.activeAthletes}
            unit={`/ ${kpis.totalAthletes}`}
            delta={{ direction: 'flat', label: '—', isPositive: true }}
          />
          <KPICard
            label="CTL médio do time"
            value={kpis.avgCTL}
            unit="pts"
            delta={{ direction: 'up', label: '+6', isPositive: true }}
            sparkline={{ data: sparklineData.ctl as unknown as number[], semantic: 'positive-up' }}
            tooltip="Chronic Training Load — carga crônica média dos atletas ativos"
          />
          <KPICard
            label="TSB médio"
            value={kpis.avgTSB}
            unit="pts"
            delta={{ direction: 'up', label: '+4', isPositive: true }}
            tooltip="Training Stress Balance — equilíbrio entre carga e recuperação"
          />
          <KPICard
            label="Adesão ao plano"
            value={kpis.adherenceRate}
            unit="%"
            delta={{ direction: 'up', label: '+5%', isPositive: true }}
            sparkline={{ data: sparklineData.adherence as unknown as number[], semantic: 'positive-up' }}
          />
          <KPICard
            label="Volume total"
            value={kpis.totalVolumeKm}
            unit="km"
            delta={{ direction: 'up', label: '+50km', isPositive: true }}
          />
          <KPICard
            label="Validações pendentes"
            value={kpis.pendingValidations}
            emphasis="normal"
          />
          <KPICard
            label="Alertas ativos"
            value={kpis.alertsCount}
            emphasis="normal"
          />
        </Box>
      </Box>

      {/* Attention section */}
      {athletesNeedingAttention.length > 0 && (
        <Box>
          <SectionHeading>Atenção necessária</SectionHeading>
          <Box
            sx={{
              backgroundColor: elevation.card,
              border:          `1px solid ${content.cardBorder}`,
              borderRadius:    1,
              overflow:        'hidden',
            }}
          >
            {athletesNeedingAttention.map((athlete, idx) => (
              <Box
                key={athlete.id}
                sx={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        1.5,
                  px:         2,
                  py:         1.25,
                  borderTop:  idx > 0 ? `1px solid ${content.divider}` : undefined,
                }}
              >
                <CoachAthleteAvatar
                  athlete={{ id: athlete.id, name: athlete.name }}
                  size="xs"
                  status={athlete.status === 'danger' ? 'alert' : 'warning'}
                />
                <Typography
                  sx={{
                    flex:     1,
                    fontSize: '0.875rem',
                    color:    surface[50],
                    fontWeight: 500,
                  }}
                >
                  {athlete.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatusBadge
                    variant={athlete.status}
                    label={athlete.status === 'danger' ? 'Crítico' : 'Atenção'}
                    size="sm"
                  />
                  <PhaseIndicator phase={athlete.phase} variant="pill" />
                </Box>
                <Typography
                  sx={{
                    fontSize:          '0.75rem',
                    color:             athlete.tsb < -20 ? semantic.danger[500] : semantic.warning[500],
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight:        600,
                  }}
                >
                  TSB {athlete.tsb > 0 ? `+${athlete.tsb}` : athlete.tsb}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Top athletes table */}
      <Box>
        <SectionHeading>Status dos atletas em destaque</SectionHeading>
        <Box
          sx={{
            backgroundColor: elevation.card,
            border:          `1px solid ${content.cardBorder}`,
            borderRadius:    1,
            overflow:        'hidden',
          }}
        >
          {topAthletes.map((athlete, idx) => (
            <Box
              key={athlete.id}
              sx={{
                display:    'flex',
                alignItems: 'center',
                gap:        1.5,
                px:         2,
                py:         1.25,
                borderTop:  idx > 0 ? `1px solid ${content.divider}` : undefined,
              }}
            >
              <CoachAthleteAvatar
                athlete={{ id: athlete.id, name: athlete.name }}
                size="xs"
              />
              <Typography
                sx={{
                  flex:      1,
                  fontSize:  '0.875rem',
                  color:     surface[50],
                  fontWeight: 500,
                }}
              >
                {athlete.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhaseIndicator phase={athlete.phase} variant="pill" />
                <StatusBadge
                  variant={athlete.status}
                  label={
                    athlete.status === 'active'  ? 'OK' :
                    athlete.status === 'danger'  ? 'Crítico' :
                    'Atenção'
                  }
                  size="sm"
                />
              </Box>
              <Box sx={{ minWidth: 80, textAlign: 'right' }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize:           '0.75rem',
                    color:              surface[400],
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  CTL {athlete.ctl}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function TabCarga() {
  const { weeklyLoad } = MOCK_INSIGHTS;

  // hex with 30% opacity for bar fill
  const barFill = `${primary[500]}4D`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <SectionHeading>Evolução de CTL médio do time</SectionHeading>
        <Box
          sx={{
            backgroundColor: elevation.card,
            border:          `1px solid ${content.cardBorder}`,
            borderRadius:    1,
            p:               2,
          }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyLoad} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis
                dataKey="week"
                stroke={CHART_AXIS_STROKE}
                tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }}
              />
              <YAxis
                stroke={CHART_AXIS_STROKE}
                tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: CHART_TOOLTIP_BG,
                  border:          'none',
                  borderRadius:    4,
                  color:           CHART_TOOLTIP_COLOR,
                }}
                labelStyle={{ color: CHART_TOOLTIP_COLOR }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '0.8rem', color: CHART_AXIS_STROKE }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="avgCTL"
                name="CTL médio"
                stroke={categorical.cat1}
                strokeWidth={2.5}
                dot={{ fill: categorical.cat1, r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="avgATL"
                name="ATL médio"
                stroke={semantic.warning[500]}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ fill: semantic.warning[500], r: 3 }}
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
            <BarChart data={weeklyLoad} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis
                dataKey="week"
                stroke={CHART_AXIS_STROKE}
                tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }}
              />
              <YAxis
                stroke={CHART_AXIS_STROKE}
                tick={{ fontSize: 12, fill: CHART_AXIS_STROKE }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: CHART_TOOLTIP_BG,
                  border:          'none',
                  borderRadius:    4,
                  color:           CHART_TOOLTIP_COLOR,
                }}
                labelStyle={{ color: CHART_TOOLTIP_COLOR }}
                formatter={(value) => [`${value} km`, 'Volume']}
              />
              <Bar
                dataKey="totalKm"
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
      <Box
        sx={{
          display:             'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap:                 2,
        }}
      >
        <KPICard
          label="Melhor performance recente"
          value="—"
          emphasis="normal"
        />
        <KPICard
          label="PRs do período"
          value="—"
          emphasis="normal"
        />
      </Box>
      <PlaceholderCard>
        Histórico de simulações de prova em breve
      </PlaceholderCard>
    </Box>
  );
}

function TabSaude() {
  const { kpis } = MOCK_INSIGHTS;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display:             'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap:                 2,
        }}
      >
        <KPICard
          label="Alertas de overreaching"
          value={kpis.alertsCount}
          unit="atletas"
          emphasis="normal"
        />
      </Box>
      <PlaceholderCard>
        Integração com HRV e dados de sono em breve
      </PlaceholderCard>
    </Box>
  );
}

function TabComparativos() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PlaceholderCard>
        Comparação entre grupos de atletas em breve
      </PlaceholderCard>
    </Box>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Visão geral',  panel: <TabVisaoGeral /> },
  { label: 'Carga',        panel: <TabCarga /> },
  { label: 'Performance',  panel: <TabPerformance /> },
  { label: 'Saúde',        panel: <TabSaude /> },
  { label: 'Comparativos', panel: <TabComparativos /> },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachInsightsPage() {
  const [activeTab, setActiveTab] = useState(0);

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
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          px:         3,
          pt:         3,
          pb:         0,
          flexShrink: 0,
          borderBottom: `1px solid ${content.divider}`,
        }}
      >
        {/* Title row */}
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            mb:             2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InsightsIcon sx={{ color: primary[500], fontSize: 26 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color:      surface[50],
                  lineHeight: 1.2,
                }}
              >
                Insights
              </Typography>
              <Typography variant="body2" sx={{ color: surface[400] }}>
                {MOCK_INSIGHTS.period.label}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: surface[700],
              color:        surface[400],
              fontSize:     '0.75rem',
              '&:hover': {
                borderColor:     surface[600],
                backgroundColor: `${surface[0]}0A`,
              },
            }}
          >
            Comparar com período ant.
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              backgroundColor: primary[500],
            },
            '& .MuiTab-root': {
              color:      surface[500],
              fontSize:   '0.8rem',
              fontWeight: 500,
              minHeight:  40,
              py:         0,
              '&.Mui-selected': {
                color: primary[500],
              },
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* ── Tab panel ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex:     1,
          overflow: 'auto',
          p:        3,
        }}
      >
        {TABS[activeTab].panel}
      </Box>
    </Box>
  );
}
