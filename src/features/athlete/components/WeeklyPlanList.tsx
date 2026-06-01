import * as React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { primary, surface, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { DayCard } from './DayCard';
import type { DayCardWorkout, CompletionStatus } from './DayCard';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklyWorkout {
  date: Date;
  workout: DayCardWorkout | null;
  completionStatus: CompletionStatus;
}

export interface WeeklyPlanListProps {
  week: WeeklyWorkout[];
  totalTSS: number;
  targetTSS: number;
  weekLabel?: string; // ex: "Semana leve planejada"
  onDayPress: (date: Date) => void;
}

// ── TSS progress helpers ───────────────────────────────────────────────────────

function getTSSBarColor(ratio: number): string {
  if (ratio > 1.1) return semantic.warning[500];
  if (ratio >= 0.8) return semantic.success[500];
  return primary[500];
}

function getTSSInterpretation(ratio: number): string {
  if (ratio < 0.6) return 'Semana leve — abaixo do planejado';
  if (ratio < 0.85) return 'Semana moderada — dentro do planejado';
  if (ratio <= 1.0) return 'Semana completa — ótima execução!';
  return 'Semana intensa — monitore a recuperação';
}

// ── isToday helper ────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── WeeklyPlanList ─────────────────────────────────────────────────────────────

export function WeeklyPlanList({
  week,
  totalTSS,
  targetTSS,
  weekLabel,
  onDayPress,
}: WeeklyPlanListProps) {
  const today = React.useMemo(() => new Date(), []);

  // Ref map: one ref per day card; we expose the "today" ref for auto-scroll
  const todayRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll to today on mount
  React.useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, []);

  // TSS ratio (clamped to 0-150% for progress bar, label uses raw ratio)
  const ratio = targetTSS > 0 ? totalTSS / targetTSS : 0;
  const progressValue = Math.min(ratio * 100, 150);
  const barColor = getTSSBarColor(ratio);
  const interpretation = getTSSInterpretation(ratio);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        bgcolor: elevation.card,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${surface[700]}`,
      }}
    >
      {/* ── Scroll horizontal de DayCards ── */}
      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          gap: '8px',
          padding: '12px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${surface[600]} transparent`,
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: surface[600],
            borderRadius: '4px',
          },
          // Garantir altura uniforme nos cards
          alignItems: 'stretch',
        }}
      >
        {week.map((day) => {
          const isToday = isSameDay(day.date, today);
          const isFuture = day.date > today && !isToday;

          return (
            <DayCard
              key={day.date.toISOString()}
              date={day.date}
              isToday={isToday}
              isFuture={isFuture}
              workout={day.workout}
              completionStatus={day.completionStatus}
              onPress={onDayPress}
              cardRef={isToday ? todayRef : undefined}
            />
          );
        })}
      </Box>

      {/* ── Divisor ── */}
      <Box sx={{ height: '1px', bgcolor: surface[700], mx: 0 }} />

      {/* ── Footer: Carga da semana ── */}
      <Box sx={{ px: '16px', py: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontSize: '0.8rem', fontWeight: 600, color: surface[300] }}
          >
            Carga da semana
          </Typography>
          <Typography
            sx={{ fontSize: '0.8rem', fontWeight: 700, color: surface[50] }}
          >
            {totalTSS} / {targetTSS} TSS
          </Typography>
        </Box>

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: surface[700],
            '& .MuiLinearProgress-bar': {
              bgcolor: barColor,
              borderRadius: 3,
              transition: 'width 0.4s ease, background-color 0.3s ease',
            },
          }}
        />

        {/* Interpretação qualitativa */}
        <Typography
          sx={{ fontSize: '0.75rem', color: surface[400], fontStyle: 'italic' }}
        >
          {weekLabel ? `${weekLabel} — ` : ''}{interpretation}
        </Typography>
      </Box>
    </Box>
  );
}

export default WeeklyPlanList;
