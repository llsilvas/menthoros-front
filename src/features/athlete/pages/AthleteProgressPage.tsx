import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Typography,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { TrendingUp as ProgressIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import { primary, surface, glassSx } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteTreinosRecentes } from '../../../hooks/useAthleteTreinosRecentes';
import { buildPmcDataPoints } from '../adapters/pmcAdapter';
import { buildZoneDistributionPercent } from '../adapters/zonesAdapter';
import { buildRecordRows } from '../adapters/recordsAdapter';
import { buildAderenciaResumo } from '../adapters/aderenciaAdapter';

// Lazy load: recharts é pesado (~300KB) — carrega só quando a tab é acessada
const PMCChart = lazy(() =>
  import('../components/PMCChart').then(m => ({ default: m.PMCChart }))
);
const ZoneDistributionInsight = lazy(() =>
  import('../components/ZoneDistributionInsight').then(m => ({ default: m.ZoneDistributionInsight }))
);

const VOLUME_DIAS = 28; // 4 semanas cheias (D0.2) — GET /me/treinos permite no máx 30 dias
const ADERENCIA_SEMANAS = 4; // D0.1
const ZONAS_PERIOD_LABEL = 'Últimos 90 dias'; // default do backend quando from/to omitidos

function ChartSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 1.5 }}>
      <CircularProgress size={24} sx={{ color: primary[500] }} />
      <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>Carregando gráfico…</Typography>
    </Box>
  );
}

function RetryAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert
      severity="warning"
      variant="outlined"
      action={<Button color="inherit" size="small" onClick={onRetry}>Tentar novamente</Button>}
    >
      {message}
    </Alert>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Typography sx={{ color: surface[400], fontSize: '0.85rem', textAlign: 'center', p: 3 }}>
      {message}
    </Typography>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
          <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>
            {label}
          </Typography>
          <InfoIcon sx={{ fontSize: 13, color: surface[500] }} />
        </Box>
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

function formatSinal(n: number): string {
  return n > 0 ? `+${Math.round(n)}` : `${Math.round(n)}`;
}

/** Monta os KPIs a partir do que já carregou; fonte sem dado → "—", nunca fabrica (CA3). */
function buildKpis(
  ultimoPmc: { ctl: number; atl: number; tsb: number } | undefined,
  volumeKm: number | null,
  aderencia: { totalRealizado: number; totalPlanejado: number } | null,
): KpiData[] {
  return [
    {
      label: 'Condicionamento (CTL)', unit: 'pts',
      value: ultimoPmc ? String(Math.round(ultimoPmc.ctl)) : '—',
      tooltip: 'Carga crônica — sua forma física dos últimos dias.',
    },
    {
      label: 'Cansaço (ATL)', unit: 'pts',
      value: ultimoPmc ? String(Math.round(ultimoPmc.atl)) : '—',
      tooltip: 'Carga aguda — fadiga acumulada dos últimos dias.',
    },
    {
      label: 'Forma (TSB)', unit: 'pts',
      value: ultimoPmc ? formatSinal(ultimoPmc.tsb) : '—',
      tooltip: 'Equilíbrio entre carga e recuperação. Positivo = fresco.',
    },
    {
      label: 'Volume total', unit: 'km',
      value: volumeKm != null ? String(Math.round(volumeKm)) : '—',
      tooltip: `Total de quilômetros corridos nos últimos ${VOLUME_DIAS} dias.`,
    },
    {
      label: 'Treinos concluídos', unit: aderencia ? `de ${aderencia.totalPlanejado}` : '',
      value: aderencia ? String(aderencia.totalRealizado) : '—',
      tooltip: `Taxa de adesão ao plano nas últimas ${ADERENCIA_SEMANAS} semanas.`,
    },
  ];
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AthleteProgressPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { pmc, loading: pmcLoading, error: pmcError, fetchPmc } = useAthletePmc();
  const { zones, loading: zonesLoading, error: zonesError, fetchZones } = useAthleteZones();
  const { recordes, loading: recordesLoading, error: recordesError, fetchRecordes } = useAthleteRecordes();
  const { aderencia, loading: aderenciaLoading, error: aderenciaError, fetchAderencia } = useAthleteAderencia();
  const { treinos, loading: treinosLoading, error: treinosError, fetchTreinosRecentes } = useAthleteTreinosRecentes();

  useEffect(() => {
    fetchPmc();
    fetchZones();
    fetchRecordes();
    fetchAderencia(ADERENCIA_SEMANAS);
    fetchTreinosRecentes(VOLUME_DIAS);
  }, [fetchPmc, fetchZones, fetchRecordes, fetchAderencia, fetchTreinosRecentes]);

  const initialLoading = pmcLoading && zonesLoading && recordesLoading && aderenciaLoading && treinosLoading
    && pmc.length === 0 && !zones && recordes.length === 0 && aderencia.length === 0 && treinos.length === 0;

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const ultimoPmc = pmc.length > 0 ? pmc[pmc.length - 1] : undefined;
  const volumeKm = treinosError ? null : treinos.reduce((soma, t) => soma + (t.distanciaKm ?? 0), 0);
  const aderenciaResumo = buildAderenciaResumo(aderencia);
  const kpis = buildKpis(ultimoPmc, volumeKm, aderenciaResumo);

  function renderTabContent(tab: TabId) {
    switch (tab) {
      case 'overview':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(treinosError || aderenciaError) && (
              <RetryAlert
                message="Alguns indicadores podem estar desatualizados."
                onRetry={() => { fetchTreinosRecentes(VOLUME_DIAS); fetchAderencia(ADERENCIA_SEMANAS); }}
              />
            )}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 2,
              }}
            >
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </Box>
          </Box>
        );

      case 'forma':
        if (pmcError) {
          return <RetryAlert message="Não foi possível carregar seu histórico de forma." onRetry={fetchPmc} />;
        }
        if (pmcLoading && pmc.length === 0) {
          return <ChartSkeleton />;
        }
        if (pmc.length === 0) {
          return <EmptyState message="Ainda não há histórico de forma (PMC) suficiente." />;
        }
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <PMCChart data={buildPmcDataPoints(pmc)} range="12w" />
          </Suspense>
        );

      case 'volume': {
        if (zonesError) {
          return <RetryAlert message="Não foi possível carregar sua distribuição de zonas." onRetry={fetchZones} />;
        }
        if (zonesLoading && !zones) {
          return <ChartSkeleton />;
        }
        const distribution = zones ? buildZoneDistributionPercent(zones) : null;
        if (!distribution || !zones) {
          return <EmptyState message="Ainda não há dados de zona de FC suficientes." />;
        }
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <ZoneDistributionInsight
              distribution={distribution}
              totalDuration={zones.duracaoTotalSegundos}
              periodLabel={ZONAS_PERIOD_LABEL}
            />
          </Suspense>
        );
      }

      case 'provas': {
        if (recordesError) {
          return <RetryAlert message="Não foi possível carregar seus recordes." onRetry={fetchRecordes} />;
        }
        if (recordesLoading && recordes.length === 0) {
          return <ChartSkeleton />;
        }
        const rows = buildRecordRows(recordes);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: surface[50], fontWeight: 700 }}>Seus PRs</Typography>
            {rows.length === 0 ? (
              <EmptyState message="Ainda sem recordes." />
            ) : (
              rows.map((pr) => (
                <Box
                  key={pr.distancia}
                  sx={{
                    ...glassSx,
                    borderRadius: 1,
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ color: surface[50], fontWeight: 600 }}>{pr.distancia}</Typography>
                  <Typography sx={{ color: primary[500], fontWeight: 800 }}>{pr.tempoFormatado}</Typography>
                  <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>{pr.data}</Typography>
                </Box>
              ))
            )}
          </Box>
        );
      }
    }
  }

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
