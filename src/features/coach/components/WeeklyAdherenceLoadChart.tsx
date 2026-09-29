import { useId, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { semantic, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';
import {
  INDISPONIVEL_ADESAO,
  INDISPONIVEL_CARGA,
  describeWeek,
  weeklyAdherenceTone,
  formatGapCaption,
} from '../adapters/diagnosisChartsAdapters';
import type { DiagnosisAvailability } from '../adapters/diagnosisChartsAdapters';
import type { MetricTone } from '../types/AthleteForm';
import type { DataGap, WeeklyDiagnosisPoint } from '../types/CoachInbox';

interface WeeklyAdherenceLoadChartProps extends DiagnosisAvailability {
  weeks: WeeklyDiagnosisPoint[];
  gaps: DataGap[];
}

interface Row extends WeeklyDiagnosisPoint {
  adherenceLabel: string;
  tssLabel: string;
}

const SYNC_ID = 'coach-diagnosis-weeks';
const AXIS = surface[400];
const Y_WIDTH = 40;

const TONE_COLOR: Record<MetricTone, string> = {
  success: semantic.success[500],
  neutral: surface[300],
  warning: semantic.warning[500],
  danger: semantic.danger[500],
};

const TONE_LEGEND: Array<{ tone: MetricTone; label: string }> = [
  { tone: 'success', label: '≥ 85%' },
  { tone: 'neutral', label: '70–84%' },
  { tone: 'warning', label: '< 70%' },
];

/** Semanas consecutivas sem registro viram uma única área hachurada. */
function noDataRuns(weeks: WeeklyDiagnosisPoint[]): Array<{ x1: string; x2: string }> {
  const runs: Array<{ x1: string; x2: string }> = [];
  let inicio: string | null = null;
  weeks.forEach((w, i) => {
    if (w.noData && inicio == null) inicio = w.weekStart;
    const fecha = inicio != null && (!w.noData || i === weeks.length - 1);
    if (fecha && inicio != null) {
      runs.push({ x1: inicio, x2: w.noData ? w.weekStart : weeks[i - 1].weekStart });
      inicio = null;
    }
  });
  return runs;
}

interface WeekTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  availability: DiagnosisAvailability;
}

function WeekTooltip({ active, payload, availability }: WeekTooltipProps) {
  const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined;
  if (!row) return null;
  const texto = describeWeek(row, availability);
  const corAdesao =
    availability.adherenceAvailable && row.adherence != null ? TONE_COLOR[weeklyAdherenceTone(row)] : surface[300];
  return (
    <Box sx={{ bgcolor: surface[700], color: surface[50], borderRadius: 1.5, px: 1.25, py: 1, minWidth: 170 }}>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, mb: 0.25 }}>{texto.title}</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: corAdesao }}>{texto.adherence}</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: surface[300] }}>{texto.load}</Typography>
    </Box>
  );
}

function Unavailable({ children }: { children: string }) {
  return <Typography sx={{ fontSize: '0.82rem', color: surface[400], py: 2 }}>{children}</Typography>;
}

function PanelLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400], mb: 0.25 }}>
      {children}
    </Typography>
  );
}

/**
 * Adesão (%) e carga (TSS) por semana, no mesmo eixo, em ordem cronológica. Substitui as barras
 * "S1…Sn" sem data e a linha "Tendência de carga" (que plotava CTL, não carga).
 */
export function WeeklyAdherenceLoadChart({ weeks, gaps, adherenceAvailable, pmcAvailable }: WeeklyAdherenceLoadChartProps) {
  const patternId = `weeks-gap-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rows = useMemo<Row[]>(
    () =>
      weeks.map((w) => ({
        ...w,
        adherenceLabel: w.adherence != null ? `${w.adherence}%` : '',
        tssLabel: w.tss != null ? String(w.tss) : '',
      })),
    [weeks],
  );
  const runs = useMemo(() => noDataRuns(weeks), [weeks]);
  const labelByWeek = useMemo(() => new Map(weeks.map((w) => [w.weekStart, w.label])), [weeks]);

  const availability = useMemo(() => ({ adherenceAvailable, pmcAvailable }), [adherenceAvailable, pmcAvailable]);

  if (!adherenceAvailable && !pmcAvailable) {
    return <Unavailable>Dado indisponível</Unavailable>;
  }
  // Só é "vazio" se o que falta foi de fato consultado; consulta que falhou não é ausência de plano.
  const vazio =
    adherenceAvailable &&
    pmcAvailable &&
    (weeks.length === 0 || weeks.every((w) => w.adherence == null && w.tss == null));
  if (vazio) {
    return (
      <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>
        Sem plano nem carga nas últimas 8 semanas.
      </Typography>
    );
  }

  const hatch = (
    <defs>
      <pattern id={patternId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={2} height={6} fill={overlayWhite[10]} />
      </pattern>
    </defs>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'flex-end' }}>
        {TONE_LEGEND.map((l) => (
          <Box key={l.tone} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: TONE_COLOR[l.tone] }} />
            <Typography sx={{ fontSize: '0.72rem', color: surface[300] }}>{l.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box>
        <PanelLabel>Adesão ao plano</PanelLabel>
        {!adherenceAvailable ? <Unavailable>{INDISPONIVEL_ADESAO}</Unavailable> : (
        <Box sx={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} syncId={SYNC_ID} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
              {hatch}
              <CartesianGrid vertical={false} stroke={overlayWhite[8]} strokeDasharray="3 3" />
              <XAxis dataKey="weekStart" hide />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v: number) => `${v}%`} width={Y_WIDTH} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
              {runs.map((r) => (
                <ReferenceArea key={r.x1} x1={r.x1} x2={r.x2} fill={`url(#${patternId})`} fillOpacity={1} strokeOpacity={0} />
              ))}
              <Tooltip content={<WeekTooltip availability={availability} />} cursor={{ fill: overlayWhite[4] }} />
              <Bar dataKey="adherence" maxBarSize={28} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.weekStart} fill={TONE_COLOR[weeklyAdherenceTone(r)]} />
                ))}
                <LabelList dataKey="adherenceLabel" position="top" fill={surface[200]} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        )}
      </Box>

      <Box>
        <PanelLabel>Carga semanal (TSS)</PanelLabel>
        {!pmcAvailable ? <Unavailable>{INDISPONIVEL_CARGA}</Unavailable> : (
        <Box sx={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} syncId={SYNC_ID} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
              {hatch}
              <CartesianGrid vertical={false} stroke={overlayWhite[8]} strokeDasharray="3 3" />
              <XAxis
                dataKey="weekStart"
                interval={0}
                tickFormatter={(v: string) => labelByWeek.get(v) ?? v}
                tick={{ fontSize: 11, fill: AXIS }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis width={Y_WIDTH} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
              {runs.map((r) => (
                <ReferenceArea
                  key={r.x1}
                  x1={r.x1}
                  x2={r.x2}
                  fill={`url(#${patternId})`}
                  fillOpacity={1}
                  strokeOpacity={0}
                  label={{ value: 'Sem treinos registrados', position: 'center', fill: surface[300], fontSize: 12 }}
                />
              ))}
              <Tooltip content={<WeekTooltip availability={availability} />} cursor={{ fill: overlayWhite[4] }} />
              <Bar dataKey="tss" maxBarSize={28} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.weekStart} fill={r.current ? surface[300] : surface[600]} />
                ))}
                <LabelList dataKey="tssLabel" position="top" fill={surface[300]} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        )}
      </Box>

      {gaps.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {gaps.map((g) => (
            <Typography key={g.start} sx={{ fontSize: '0.75rem', color: surface[300] }}>
              {formatGapCaption(g)}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
