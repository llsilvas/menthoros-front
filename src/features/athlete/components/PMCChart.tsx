import { useId, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { primary, surface, semantic } from '../../../theme/tokens';
import { glassSx } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';
import { FAIXA_APRESENTACAO } from '../../../types/FaixaTsb';
import type { MetricTone } from '../../../types/FaixaTsb';
import { buildPmcChartModel } from '../adapters/pmcChartModel';
import type { PMCDataPoint, PMCGap, PMCRange, PmcChartRow, PmcGapArea, PmcSeriesKey } from '../adapters/pmcChartModel';

export type { PMCDataPoint, PMCGap, PMCRange } from '../adapters/pmcChartModel';

export interface PMCChartProps {
  data: PMCDataPoint[];
  range: PMCRange;
  defaultMode?: 'simple' | 'advanced';
  onRangeChange?: (range: PMCRange) => void;
  /** Períodos sem treinos registrados: área hachurada + linhas tracejadas. */
  gaps?: PMCGap[];
  /** Sem vidro nem título próprio — para viver dentro de um `SectionCard`. */
  embedded?: boolean;
  /** O que o modo Simples mostra: carga diária (TSS) ou Forma (TSB) colorida pela faixa. */
  simpleMetric?: 'tss' | 'forma';
  ranges?: PMCRange[];
  /** A consulta da série falhou no backend: mostra o aviso em vez de um gráfico vazio. */
  unavailable?: boolean;
}

type ViewMode = 'simple' | 'advanced';

// ── Chart tokens ──────────────────────────────────────────────────────────────

const CHART_GRID_STROKE = overlayWhite[8];
const CHART_AXIS_STROKE = surface[400];
const CHART_TOOLTIP_BG = surface[700];
const CHART_TOOLTIP_COLOR = surface[50];
const CHART_HEIGHT = 240;

const RANGE_LABELS: Record<PMCRange, string> = {
  '4w': '4s',
  '8w': '8s',
  '12w': '12s',
  '6m': '6m',
  '1y': '1a',
};

/**
 * Todas as telas recebem a série padrão do backend (90 dias) e nenhuma refaz a consulta ao trocar o
 * período; oferecer 6m/1a mostraria meses sem dado como se o atleta não tivesse treinado. Uma tela
 * que buscar por período passa `ranges` explicitamente.
 */
const DEFAULT_RANGES: PMCRange[] = ['4w', '8w', '12w'];
const NO_GAPS: PMCGap[] = [];

/**
 * Forma saía em `primary[500]`: lime é reservado a marca/ação primária (`forbidden-uses.ts`) e
 * disputava atenção com o destaque da tela. Off-white separa bem de verde e vermelho.
 */
const SERIES: ReadonlyArray<{ key: PmcSeriesKey; label: string; code: string; color: string }> = [
  { key: 'ctl', label: 'Condicionamento', code: 'CTL', color: semantic.success[500] },
  { key: 'atl', label: 'Cansaço', code: 'ATL', color: semantic.danger[500] },
  { key: 'tsb', label: 'Forma', code: 'TSB', color: surface[50] },
];

const TONE_COLOR: Record<MetricTone, string> = {
  success: semantic.success[500],
  warning: semantic.warning[500],
  danger: semantic.danger[500],
  neutral: surface[300],
};

const GAP_LABEL = 'Sem treinos registrados';

// ── Formatters ────────────────────────────────────────────────────────────────

const formatTick = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const formatDay = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatNumber = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatSigned = (v: number) => `${v > 0 ? '+' : ''}${formatNumber(v)}`;
const formatSeries = (key: PmcSeriesKey, v: number) => (key === 'tsb' ? formatSigned(v) : formatNumber(v));

function toneOf(row: PmcChartRow): MetricTone {
  return row.statusForma ? FAIXA_APRESENTACAO[row.statusForma]?.tone ?? 'neutral' : 'neutral';
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}

function ToggleButton({ label, active, onClick, small = false }: ToggleButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      aria-pressed={active}
      onClick={onClick}
      sx={{
        px: small ? 1 : 1.5,
        py: small ? 0.25 : 0.5,
        fontSize: small ? '0.72rem' : '0.78rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        border: 'none',
        borderRadius: 1,
        bgcolor: active ? surface[700] : 'transparent',
        color: active ? surface[50] : surface[400],
        transition: 'all 0.15s ease',
        '&:hover': { bgcolor: active ? surface[700] : surface[800], color: surface[50] },
      }}
    >
      {label}
    </Box>
  );
}

function GapPattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={2} height={6} fill={overlayWhite[10]} />
      </pattern>
    </defs>
  );
}

interface TooltipContentProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  view: ViewMode;
  simpleMetric: 'tss' | 'forma';
}

function PmcTooltip({ active, payload, view, simpleMetric }: TooltipContentProps) {
  const row = active ? (payload?.[0]?.payload as PmcChartRow | undefined) : undefined;
  if (!row || row.missing) return null;

  const linhas: Array<{ label: string; value: string; color: string }> = [];
  if (view === 'advanced') {
    for (const s of SERIES) {
      const v = row[s.key];
      if (v != null) linhas.push({ label: s.label, value: formatSeries(s.key, v), color: s.color });
    }
  } else if (simpleMetric === 'forma' && row.tsb != null) {
    const faixa = row.statusForma ? FAIXA_APRESENTACAO[row.statusForma]?.label : null;
    linhas.push({ label: 'Forma', value: formatSigned(row.tsb), color: TONE_COLOR[toneOf(row)] });
    if (faixa) linhas.push({ label: 'Faixa', value: faixa, color: TONE_COLOR[toneOf(row)] });
  } else if (row.tss != null) {
    linhas.push({ label: 'TSS', value: String(Math.round(row.tss)), color: surface[50] });
  }

  return (
    <Box sx={{ bgcolor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_COLOR, borderRadius: 1.5, px: 1.25, py: 1, fontSize: '0.8rem', minWidth: 160 }}>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, mb: 0.5 }}>{formatDay(row.t)}</Typography>
      {linhas.map((l) => (
        <Box key={l.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: '0.78rem', color: surface[300] }}>{l.label}</Typography>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: l.color }}>{l.value}</Typography>
        </Box>
      ))}
      {row.inGap ? (
        <Typography sx={{ fontSize: '0.72rem', color: surface[400], mt: 0.5 }}>Estimado — {GAP_LABEL.toLowerCase()}</Typography>
      ) : null}
    </Box>
  );
}

function SeriesLegend({ latest }: { latest: PmcChartRow | null }) {
  if (!latest) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: { xs: 2, md: 3 }, mb: 1.5 }}>
      {SERIES.map((s) => {
        const v = latest[s.key];
        return (
          <Box key={s.key}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 3, borderRadius: 2, bgcolor: s.color }} />
              <Typography sx={{ fontSize: '0.75rem', color: surface[300] }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: surface[500] }}>{s.code}</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: surface[50], fontVariantNumeric: 'tabular-nums' }}>
              {v != null ? formatSeries(s.key, v) : '—'}
            </Typography>
          </Box>
        );
      })}
      <Typography sx={{ fontSize: '0.75rem', color: surface[500], pb: 0.4 }}>
        {formatTick(latest.t)}{latest.inGap ? ' · estimado' : ''}
      </Typography>
    </Box>
  );
}

interface ChartBodyProps {
  rows: PmcChartRow[];
  ticks: number[];
  gapAreas: PmcGapArea[];
  patternId: string;
  simpleMetric: 'tss' | 'forma';
}

function sharedAxes(ticks: number[]) {
  return [
    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />,
    <XAxis
      key="x"
      dataKey="t"
      ticks={ticks}
      interval={0}
      tickFormatter={formatTick}
      stroke={CHART_AXIS_STROKE}
      tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
      tickLine={false}
      axisLine={false}
    />,
    <YAxis
      key="y"
      stroke={CHART_AXIS_STROKE}
      tick={{ fontSize: 11, fill: CHART_AXIS_STROKE }}
      tickLine={false}
      axisLine={false}
      width={36}
    />,
  ];
}

function gapLayers(gapAreas: PmcGapArea[], patternId: string) {
  return gapAreas.map((g) => (
    <ReferenceArea
      key={`gap-${g.x1}`}
      x1={g.x1}
      x2={g.x2}
      fill={`url(#${patternId})`}
      fillOpacity={1}
      strokeOpacity={0}
      label={{ value: GAP_LABEL, position: 'insideTop', fill: surface[300], fontSize: 12 }}
    />
  ));
}

function SimpleChart({ rows, ticks, gapAreas, patternId, simpleMetric }: ChartBodyProps) {
  const forma = simpleMetric === 'forma';
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={rows} margin={{ top: 20, right: 16, left: 0, bottom: 5 }}>
        <GapPattern id={patternId} />
        {sharedAxes(ticks)}
        {gapLayers(gapAreas, patternId)}
        <Tooltip content={<PmcTooltip view="simple" simpleMetric={simpleMetric} />} cursor={{ fill: overlayWhite[4] }} />
        {forma ? <ReferenceLine y={0} stroke={surface[500]} strokeWidth={1} /> : null}
        {forma ? (
          <Bar dataKey="tsb" name="Forma" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.t} fill={TONE_COLOR[toneOf(r)]} fillOpacity={r.inGap ? 0.35 : 0.85} />
            ))}
          </Bar>
        ) : (
          // DÍVIDA: lime aqui também viola `forbidden-uses.ts`; fora do escopo desta change.
          <Bar dataKey="tss" name="TSS" fill={`${primary[500]}66`} stroke={primary[500]} strokeWidth={1} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function AdvancedChart({ rows, ticks, gapAreas, patternId }: ChartBodyProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={rows} margin={{ top: 20, right: 16, left: 0, bottom: 5 }}>
        <GapPattern id={patternId} />
        {sharedAxes(ticks)}
        {gapLayers(gapAreas, patternId)}
        <Tooltip content={<PmcTooltip view="advanced" simpleMetric="tss" />} cursor={{ stroke: surface[600] }} />
        <ReferenceLine y={0} stroke={surface[500]} strokeDasharray="4 4" strokeWidth={1} />
        {SERIES.map((s) => (
          <Line
            key={`${s.key}-est`}
            type="linear"
            dataKey={`${s.key}Est`}
            stroke={s.color}
            strokeWidth={1.5}
            strokeDasharray="3 4"
            strokeOpacity={0.55}
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
            legendType="none"
          />
        ))}
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={`${s.key}Solid`}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PMCChart({
  data,
  range,
  defaultMode = 'simple',
  onRangeChange,
  gaps = NO_GAPS,
  embedded = false,
  simpleMetric = 'tss',
  ranges = DEFAULT_RANGES,
  unavailable = false,
}: PMCChartProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [internalRange, setInternalRange] = useState<PMCRange>(range);
  const patternId = `pmc-gap-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const model = useMemo(() => buildPmcChartModel(data, gaps, internalRange), [data, gaps, internalRange]);

  function handleRangeChange(r: PMCRange) {
    setInternalRange(r);
    onRangeChange?.(r);
  }

  const subLabel =
    mode === 'advanced'
      ? null
      : simpleMetric === 'forma'
        ? 'Forma diária (TSB), colorida pela faixa'
        : 'Carga de treino diária (TSS)';

  const body = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2, justifyContent: embedded ? 'flex-end' : undefined }}>
        {embedded ? null : (
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: surface[50], flex: 1, minWidth: '120px' }}>
            Desempenho
          </Typography>
        )}
        <Box sx={{ display: 'flex', bgcolor: `${surface[0]}0A`, borderRadius: 1, p: 0.25, gap: 0.25 }}>
          <ToggleButton label="Simples" active={mode === 'simple'} onClick={() => setMode('simple')} />
          <ToggleButton label="Avançado" active={mode === 'advanced'} onClick={() => setMode('advanced')} />
        </Box>
        <Box sx={{ display: 'flex', bgcolor: `${surface[0]}0A`, borderRadius: 1, p: 0.25, gap: 0.25 }}>
          {ranges.map((r) => (
            <ToggleButton key={r} label={RANGE_LABELS[r]} active={internalRange === r} onClick={() => handleRangeChange(r)} small />
          ))}
        </Box>
      </Box>

      {unavailable ? (
        <Typography sx={{ fontSize: '0.85rem', color: surface[400], py: 4, textAlign: 'center' }}>
          Dado indisponível
        </Typography>
      ) : mode === 'advanced' ? (
        <SeriesLegend latest={model.latest} />
      ) : (
        <Typography sx={{ fontSize: '0.75rem', color: surface[500], mb: 1.5 }}>{subLabel}</Typography>
      )}

      {unavailable ? null : mode === 'simple' ? (
        <SimpleChart rows={model.rows} ticks={model.ticks} gapAreas={model.gapAreas} patternId={patternId} simpleMetric={simpleMetric} />
      ) : (
        <AdvancedChart rows={model.rows} ticks={model.ticks} gapAreas={model.gapAreas} patternId={patternId} simpleMetric={simpleMetric} />
      )}
    </>
  );

  if (embedded) return <Box>{body}</Box>;
  return <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>{body}</Box>;
}

export default PMCChart;
