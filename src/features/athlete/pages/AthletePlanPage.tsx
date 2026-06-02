import * as React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  EventNote as PlanIcon,
} from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { WeeklyPlanList } from '../components/WeeklyPlanList';
import type { WeeklyWorkout } from '../components/WeeklyPlanList';
import type { DayCardWorkout, CompletionStatus } from '../components/DayCard';

// ── Week dates helper ─────────────────────────────────────────────────────────

function getWeekDates(offset: number = 0): Date[] {
  const today = new Date();
  const monday = new Date(today);
  // getDay(): 0=Sun, 1=Mon … 6=Sat  →  offset to Monday
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ── Week label formatter ──────────────────────────────────────────────────────

function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[6];
  const firstPart = first.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const lastPart = last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${firstPart} – ${lastPart}`;
}

// ── Mock data builder (based on current week dates) ───────────────────────────

interface WorkoutDef {
  type: DayCardWorkout['type'];
  title: string;
  description: string;
  estimatedTSS: number;
  durationMinutes: number;
}

type DayDef =
  | { workout: WorkoutDef; completionStatus: CompletionStatus }
  | { workout: null; completionStatus: CompletionStatus };

function buildMockWeek(dates: Date[]): WeeklyWorkout[] {
  const WORKOUT_DEFS: DayDef[] = [
    {
      workout: {
        type: 'easy_run' as const,
        title: 'Corrida Fácil',
        description: 'Ritmo Z2, conversa possível',
        estimatedTSS: 55,
        durationMinutes: 60,
      },
      completionStatus: 'completed' as const,
    },
    {
      workout: {
        type: 'strength' as const,
        title: 'Força',
        description: 'Core e membros inferiores',
        estimatedTSS: 35,
        durationMinutes: 45,
      },
      completionStatus: 'completed' as const,
    },
    {
      workout: {
        type: 'tempo' as const,
        title: 'Tempo Run',
        description: 'Ritmo de limiar, 20min contínuo',
        estimatedTSS: 75,
        durationMinutes: 55,
      },
      completionStatus: 'pending' as const,
    },
    {
      workout: null,
      completionStatus: 'pending' as const,
    }, // descanso
    {
      workout: {
        type: 'intervals' as const,
        title: 'Tiros',
        description: '6x 1km em pace de prova',
        estimatedTSS: 90,
        durationMinutes: 65,
      },
      completionStatus: 'pending' as const,
    },
    {
      workout: {
        type: 'easy_run' as const,
        title: 'Corrida Leve',
        description: 'Recuperação ativa',
        estimatedTSS: 30,
        durationMinutes: 40,
      },
      completionStatus: 'pending' as const,
    },
    {
      workout: {
        type: 'long_run' as const,
        title: 'Longão',
        description: 'Ritmo aeróbico, 28km totais',
        estimatedTSS: 140,
        durationMinutes: 150,
      },
      completionStatus: 'pending' as const,
    },
  ];

  return dates.map((date, i) => ({
    date,
    workout: WORKOUT_DEFS[i].workout,
    completionStatus: WORKOUT_DEFS[i].completionStatus,
  }));
}

const MOCK_TSS = { totalTSS: 425, targetTSS: 480 };
const MOCK_WEEK_LABEL = 'Semana de construção — fase BUILD';

// ── AthletePlanPage ───────────────────────────────────────────────────────────

export default function AthletePlanPage() {
  const [weekOffset, setWeekOffset] = React.useState(0);

  const weekDates = React.useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = React.useMemo(() => formatWeekRange(weekDates), [weekDates]);
  const mockWeek = React.useMemo(() => buildMockWeek(weekDates), [weekDates]);

  const handlePrevWeek = React.useCallback(() => setWeekOffset((o) => o - 1), []);
  const handleNextWeek = React.useCallback(() => setWeekOffset((o) => o + 1), []);
  const handleToday = React.useCallback(() => setWeekOffset(0), []);

  const handleDayPress = React.useCallback((_date: Date) => {
    // Futuramente: abrir detalhe do treino
  }, []);

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
      {/* ── Título da página ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PlanIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}
          >
            Plano da Semana
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Treinos planejados para a semana
          </Typography>
        </Box>
      </Box>

      {/* ── Navegação de semana ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: elevation.panel,
          borderRadius: '10px',
          border: `1px solid ${surface[700]}`,
          px: 1,
          py: 0.5,
        }}
      >
        <IconButton
          onClick={handlePrevWeek}
          size="small"
          aria-label="Semana anterior"
          sx={{ color: surface[300], '&:hover': { color: primary[500] } }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: surface[50],
              textAlign: 'center',
            }}
          >
            {weekLabel}
          </Typography>

          {weekOffset !== 0 && (
            <Box
              component="button"
              onClick={handleToday}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: primary[500],
                bgcolor: `${primary[500]}1A`,
                border: `1px solid ${primary[500]}4D`,
                borderRadius: '4px',
                px: '6px',
                py: '2px',
                cursor: 'pointer',
                lineHeight: 1.4,
                '&:hover': { bgcolor: `${primary[500]}26` },
              }}
            >
              hoje
            </Box>
          )}
        </Box>

        <IconButton
          onClick={handleNextWeek}
          size="small"
          aria-label="Próxima semana"
          sx={{ color: surface[300], '&:hover': { color: primary[500] } }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* ── Lista semanal ── */}
      <WeeklyPlanList
        week={mockWeek}
        totalTSS={MOCK_TSS.totalTSS}
        targetTSS={MOCK_TSS.targetTSS}
        weekLabel={MOCK_WEEK_LABEL}
        onDayPress={handleDayPress}
      />
    </Box>
  );
}
