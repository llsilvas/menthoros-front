import { lazy, Suspense, useState } from 'react';
import {
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Typography,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { TrendingUp as ProgressIcon } from '@mui/icons-material';
import { primary, surface, glassSx } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { PMCDataPoint } from '../components/PMCChart';

// Lazy load: recharts é pesado (~300KB) — carrega só quando a tab é acessada
const PMCChart = lazy(() =>
  import('../components/PMCChart').then(m => ({ default: m.PMCChart }))
);
const ZoneDistributionInsight = lazy(() =>
  import('../components/ZoneDistributionInsight').then(m => ({ default: m.ZoneDistributionInsight }))
);

function ChartSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 1.5 }}>
      <CircularProgress size={24} sx={{ color: primary[500] }} />
      <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>Carregando gráfico…</Typography>
    </Box>
  );
}

// ── Mock data helpers ─────────────────────────────────────────────────────────

function lastNDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

const MOCK_PMC: PMCDataPoint[] = lastNDays(84).map((date, i) => ({
  date,
  tss: Math.round(50 + Math.sin(i / 7) * 20 + Math.random() * 15),
  ctl: Math.round(60 + i * 0.2 + Math.sin(i / 14) * 5),
  atl: Math.round(65 + Math.sin(i / 5) * 15 + Math.random() * 10),
  tsb: Math.round((60 + i * 0.2) - (65 + Math.sin(i / 5) * 15)),
}));

const MOCK_ZONES = {
  distribution: { z1: 35, z2: 30, z3: 15, z4: 12, z5: 8 },
  totalDuration: 18000,
  periodLabel: 'Últimas 4 semanas',
  insight: {
    type: 'positive' as const,
    message: 'Distribuição polarizada saudável — 65% em Z1-Z2. Ideal para fase BASE.',
    relatedPhase: 'BASE' as const,
  },
};

const MOCK_KPI: KpiData[] = [
  { label: 'Condicionamento (CTL)', value: '74',  unit: 'pts',   tooltip: 'Carga crônica — sua forma física dos últimos 42 dias.' },
  { label: 'Cansaço (ATL)',         value: '71',  unit: 'pts',   tooltip: 'Carga aguda — fadiga acumulada dos últimos 7 dias.' },
  { label: 'Forma (TSB)',           value: '+3',  unit: 'pts',   tooltip: 'Equilíbrio entre carga e recuperação. Positivo = fresco.' },
  { label: 'Volume total',          value: '210', unit: 'km',    tooltip: 'Total de quilômetros corridos nas últimas 4 semanas.' },
  { label: 'Treinos concluídos',    value: '18',  unit: 'de 21', tooltip: 'Taxa de adesão ao plano no período.' },
];

interface PrData {
  dist: string;
  time: string;
  date: string;
}

const MOCK_PRS: PrData[] = [
  { dist: '5 km',  time: '22:14',   date: '2026-03-15' },
  { dist: '10 km', time: '46:30',   date: '2026-02-08' },
  { dist: '21 km', time: '1:47:22', date: '2026-01-20' },
];

// ── Local sub-components ──────────────────────────────────────────────────────

interface KpiData {
  label: string;
  value: string;
  unit: string;
  tooltip: string;
}

function KpiCard({ label, value, unit, tooltip }: KpiData) {
  return (
    <Box sx={{ ...glassSx, borderRadius: 1, p: 2 }}>
      <MuiTooltip title={tooltip} placement="top">
        <Typography sx={{ color: surface[400], fontSize: '0.75rem', cursor: 'help' }}>
          {label} ℹ️
        </Typography>
      </MuiTooltip>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
        <Typography sx={{ color: surface[50], fontSize: '1.5rem', fontWeight: 800 }}>
          {value}
        </Typography>
        <Typography sx={{ color: surface[500], fontSize: '0.8rem' }}>
          {unit}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function TabOverview() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 2,
      }}
    >
      {MOCK_KPI.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </Box>
  );
}

function TabForma() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PMCChart data={MOCK_PMC} range="12w" />
    </Suspense>
  );
}

function TabVolume() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ZoneDistributionInsight
        distribution={MOCK_ZONES.distribution}
        totalDuration={MOCK_ZONES.totalDuration}
        periodLabel={MOCK_ZONES.periodLabel}
        insight={MOCK_ZONES.insight}
      />
    </Suspense>
  );
}

function TabProvas() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ color: surface[50], fontWeight: 700 }}>Seus PRs</Typography>
      {MOCK_PRS.map((pr) => (
        <Box
          key={pr.dist}
          sx={{
            ...glassSx,
            borderRadius: 1,
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ color: surface[50], fontWeight: 600 }}>{pr.dist}</Typography>
          <Typography sx={{ color: primary[500], fontWeight: 800 }}>{pr.time}</Typography>
          <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>{pr.date}</Typography>
        </Box>
      ))}
      <Typography
        sx={{
          color: surface[400],
          fontSize: '0.85rem',
          textAlign: 'center',
          pt: 1,
        }}
      >
        Simulações de prova baseadas em CTL/ATL em breve
      </Typography>
    </Box>
  );
}

// ── Tab metadata ──────────────────────────────────────────────────────────────

type TabId = 'overview' | 'forma' | 'volume' | 'provas';

interface TabMeta {
  id: TabId;
  label: string;
}

const TABS: TabMeta[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'forma',    label: 'Forma' },
  { id: 'volume',   label: 'Volume' },
  { id: 'provas',   label: 'Provas' },
];

function renderTabContent(tab: TabId) {
  switch (tab) {
    case 'overview': return <TabOverview />;
    case 'forma':    return <TabForma />;
    case 'volume':   return <TabVolume />;
    case 'provas':   return <TabProvas />;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AthleteProgressPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: elevation.base,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ProgressIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}
          >
            Progresso
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Forma, volume e evolução
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, v: TabId) => setActiveTab(v)}
        sx={{
          borderBottom: `1px solid ${surface[700]}`,
          minHeight: 40,
          '& .MuiTab-root': {
            color: surface[400],
            fontSize: '0.85rem',
            fontWeight: 500,
            minHeight: 40,
            textTransform: 'none',
            px: 2,
          },
          '& .Mui-selected': {
            color: `${primary[500]} !important`,
            fontWeight: 700,
          },
          '& .MuiTabs-indicator': {
            backgroundColor: primary[500],
          },
        }}
      >
        {TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} />
        ))}
      </Tabs>

      {/* Tab content */}
      <Box sx={{ flex: 1 }}>
        {renderTabContent(activeTab)}
      </Box>
    </Box>
  );
}
