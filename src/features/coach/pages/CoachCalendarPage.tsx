import { useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Chip, Tooltip, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { primary, surface, semantic, categorical } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { AthleteRow } from '../components/AthleteRow';
import type { AthleteUIModel } from '../components/AthleteRow';
import type { TrainingPhase } from '../../../shared/components/PhaseIndicator';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkoutType =
  | 'easy_run'
  | 'long_run'
  | 'tempo'
  | 'intervals'
  | 'recovery'
  | 'rest'
  | 'strength';

interface MockWorkout {
  athleteId: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  distanceKm?: number;
  durationMin?: number;
  isKeyWorkout: boolean;
  hasAlert: boolean;
  hasPendingSuggestion: boolean;
}

interface MockCalendarAthlete {
  id: string;
  name: string;
  phase: TrainingPhase;
  status: StatusBadgeVariant;
  isInFocus: boolean;
  workouts: MockWorkout[];
}

// ── Week helpers ──────────────────────────────────────────────────────────────

function getWeekDates(offset = 0): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function formatWeekRange(dates: string[]): string {
  const first = new Date(dates[0] + 'T12:00:00');
  const last = new Date(dates[6] + 'T12:00:00');
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  const locale = 'pt-BR';
  const firstStr = first.toLocaleDateString(locale, opts);
  const lastStr = last.toLocaleDateString(locale, { ...opts, year: 'numeric' });
  return `${firstStr} – ${lastStr}`;
}

function isToday(dateStr: string): boolean {
  return new Date().toISOString().split('T')[0] === dateStr;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Mock data ─────────────────────────────────────────────────────────────────

// Data is built dynamically so WEEK_DATES can be used as reference for today's week.
// For mock purposes, we build the initial week at module level and the athletes
// hold offsets to those dates — but since this is mock, workouts just reference
// index into current week.
function buildMockAthletes(weekDates: string[]): MockCalendarAthlete[] {
  return [
    {
      id: '1',
      name: 'Carlos Mendes',
      phase: 'BUILD',
      status: 'warning',
      isInFocus: true,
      workouts: [
        { athleteId: '1', date: weekDates[0], type: 'easy_run', distanceKm: 10, durationMin: 60, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: true },
        { athleteId: '1', date: weekDates[2], type: 'tempo', distanceKm: 12, durationMin: 65, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '1', date: weekDates[5], type: 'long_run', distanceKm: 28, durationMin: 150, isKeyWorkout: true, hasAlert: false, hasPendingSuggestion: false },
      ],
    },
    {
      id: '2',
      name: 'Ana Lima',
      phase: 'BASE',
      status: 'active',
      isInFocus: false,
      workouts: [
        { athleteId: '2', date: weekDates[1], type: 'easy_run', distanceKm: 8, durationMin: 50, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '2', date: weekDates[3], type: 'strength', distanceKm: undefined, durationMin: 45, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '2', date: weekDates[6], type: 'long_run', distanceKm: 18, durationMin: 110, isKeyWorkout: true, hasAlert: false, hasPendingSuggestion: false },
      ],
    },
    {
      id: '3',
      name: 'Rafael Costa',
      phase: 'TAPER',
      status: 'active',
      isInFocus: true,
      workouts: [
        { athleteId: '3', date: weekDates[0], type: 'easy_run', distanceKm: 8, durationMin: 45, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '3', date: weekDates[2], type: 'intervals', distanceKm: 10, durationMin: 55, isKeyWorkout: true, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '3', date: weekDates[4], type: 'rest', distanceKm: undefined, durationMin: undefined, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
      ],
    },
    {
      id: '4',
      name: 'Pedro Alves',
      phase: 'BUILD',
      status: 'danger',
      isInFocus: true,
      workouts: [
        { athleteId: '4', date: weekDates[0], type: 'easy_run', distanceKm: 12, durationMin: 70, isKeyWorkout: false, hasAlert: true, hasPendingSuggestion: false },
      ],
    },
    {
      id: '5',
      name: 'Marina Silva',
      phase: 'BASE',
      status: 'active',
      isInFocus: false,
      workouts: [
        { athleteId: '5', date: weekDates[1], type: 'easy_run', distanceKm: 9, durationMin: 55, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
        { athleteId: '5', date: weekDates[4], type: 'tempo', distanceKm: 11, durationMin: 60, isKeyWorkout: false, hasAlert: false, hasPendingSuggestion: false },
      ],
    },
  ];
}

// ── Workout color map (categorical tokens only) ───────────────────────────────

const WORKOUT_COLORS: Record<WorkoutType, string> = {
  easy_run:  categorical.cat1,  // blue
  long_run:  categorical.cat7,  // violet — key workout
  tempo:     categorical.cat3,  // amber
  intervals: categorical.cat5,  // pink
  recovery:  categorical.cat6,  // teal
  rest:      categorical.cat8,  // gray
  strength:  categorical.cat4,  // purple
};

const WORKOUT_LABEL: Record<WorkoutType, string> = {
  easy_run:  'Fácil',
  long_run:  'Longão',
  tempo:     'Tempo',
  intervals: 'Tiros',
  recovery:  'Recup.',
  rest:      'Descanso',
  strength:  'Força',
};

// ── Day header labels ─────────────────────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ── WorkoutBlock ──────────────────────────────────────────────────────────────

interface WorkoutBlockProps {
  workout: MockWorkout;
}

function WorkoutBlock({ workout }: WorkoutBlockProps) {
  const color = WORKOUT_COLORS[workout.type];
  const label = WORKOUT_LABEL[workout.type];

  const tooltipLines: string[] = [label];
  if (workout.distanceKm != null) tooltipLines.push(`${workout.distanceKm} km`);
  if (workout.durationMin != null) tooltipLines.push(`${workout.durationMin} min`);

  return (
    <Tooltip title={tooltipLines.join(' · ')} placement="top" arrow>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '4px',
          p: '3px 4px',
          fontSize: '0.7rem',
          lineHeight: 1.3,
          backgroundColor: `${color}26`,
          border: workout.isKeyWorkout
            ? `2px solid ${color}`
            : `1px solid ${color}66`,
          color: color,
          fontWeight: workout.isKeyWorkout ? 700 : 500,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          overflow: 'hidden',
          cursor: 'default',
          minWidth: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {workout.isKeyWorkout && (
          <StarIcon sx={{ fontSize: '0.65rem', flexShrink: 0 }} />
        )}
        <Typography
          component="span"
          sx={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
        {workout.distanceKm != null && (
          <Typography
            component="span"
            sx={{ fontSize: '0.6rem', color: `${color}CC`, flexShrink: 0 }}
          >
            {workout.distanceKm}k
          </Typography>
        )}
        {workout.hasAlert && (
          <WarningIcon
            sx={{ fontSize: '0.65rem', color: semantic.warning[500], flexShrink: 0 }}
          />
        )}
        {/* Pending suggestion dot */}
        {workout.hasPendingSuggestion && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: primary[500],
              flexShrink: 0,
            }}
            aria-label="Sugestão pendente"
          />
        )}
      </Box>
    </Tooltip>
  );
}

// ── Calendar grid row ─────────────────────────────────────────────────────────

interface CalendarGridRowProps {
  athlete: MockCalendarAthlete;
  weekDates: string[];
  workoutsByDate: Map<string, MockWorkout>;
}

function CalendarGridRow({ athlete, weekDates, workoutsByDate }: CalendarGridRowProps) {
  // Build AthleteUIModel for AthleteRow
  const athleteUiModel: AthleteUIModel = {
    id: athlete.id,
    name: athlete.name,
    sport: 'running',
    phase: athlete.phase,
    metrics: { ctl: 0, atl: 0, tsb: 0 },
    status: athlete.status,
    statusDot: athlete.status === 'danger' ? 'alert' : athlete.status === 'warning' ? 'warning' : 'none',
  };

  return (
    <Box
      sx={{
        display: 'contents',
      }}
    >
      {/* Athlete name cell */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderBottom: `1px solid ${surface[700]}`,
          borderRight: `1px solid ${surface[700]}`,
          backgroundColor: elevation.panel,
          position: 'sticky',
          left: 0,
          zIndex: 1,
          minWidth: 200,
          width: 200,
        }}
      >
        <AthleteRow athlete={athleteUiModel} variant="calendar" />
      </Box>

      {/* Day cells */}
      {weekDates.map((date) => {
        const workout = workoutsByDate.get(date);
        const todayDate = isToday(date);

        return (
          <Box
            key={date}
            sx={{
              px: 0.5,
              py: 0.5,
              borderBottom: `1px solid ${surface[700]}`,
              borderRight: `1px solid ${surface[700]}`,
              backgroundColor: todayDate ? `${primary[500]}08` : 'transparent',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {workout != null ? (
              <WorkoutBlock workout={workout} />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoachCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  // Build mock athletes with the correct week dates
  const allAthletes = useMemo(() => buildMockAthletes(weekDates), [weekDates]);

  const focusAthletes = useMemo(
    () => allAthletes.filter((a) => a.isInFocus),
    [allAthletes],
  );

  const displayedAthletes = showAll ? allAthletes : focusAthletes;

  const todayStr = getTodayStr();
  const isCurrentWeek = weekOffset === 0;

  // Build per-athlete lookup: athleteId -> (date -> workout)
  const workoutMaps = useMemo(() => {
    const map = new Map<string, Map<string, MockWorkout>>();
    for (const athlete of allAthletes) {
      const byDate = new Map<string, MockWorkout>();
      for (const w of athlete.workouts) {
        byDate.set(w.date, w);
      }
      map.set(athlete.id, byDate);
    }
    return map;
  }, [allAthletes]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: elevation.base,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderBottom: `1px solid ${surface[700]}`,
          backgroundColor: elevation.panel,
        }}
      >
        {/* Row 1: week navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setWeekOffset((o) => o - 1)}
              sx={{
                borderColor: surface[700],
                color: surface[300],
                '&:hover': { borderColor: surface[500], backgroundColor: `${surface[0]}0A` },
                minWidth: 32,
                px: 0.75,
              }}
              aria-label="Semana anterior"
            >
              <ChevronLeftIcon fontSize="small" />
            </Button>
            <Button
              onClick={() => setWeekOffset((o) => o + 1)}
              sx={{
                borderColor: surface[700],
                color: surface[300],
                '&:hover': { borderColor: surface[500], backgroundColor: `${surface[0]}0A` },
                minWidth: 32,
                px: 0.75,
              }}
              aria-label="Próxima semana"
            >
              <ChevronRightIcon fontSize="small" />
            </Button>
          </ButtonGroup>

          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: surface[50],
              minWidth: 160,
              textAlign: 'center',
            }}
          >
            {weekLabel}
          </Typography>

          {!isCurrentWeek && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setWeekOffset(0)}
              sx={{
                borderColor: primary[500],
                color: primary[500],
                fontSize: '0.75rem',
                px: 1,
                py: 0.25,
                '&:hover': { backgroundColor: `${primary[500]}1A` },
              }}
            >
              Hoje
            </Button>
          )}
        </Box>

        {/* Row 2: filter toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>
            Filtro:
          </Typography>

          <Chip
            label={`Em foco (${focusAthletes.length})`}
            size="small"
            onClick={() => setShowAll(false)}
            sx={{
              fontSize: '0.72rem',
              height: 24,
              backgroundColor: !showAll ? `${primary[500]}26` : `${surface[0]}0A`,
              color: !showAll ? primary[500] : surface[400],
              border: `1px solid ${!showAll ? primary[500] : surface[700]}`,
              cursor: 'pointer',
              '&:hover': { backgroundColor: !showAll ? `${primary[500]}33` : `${surface[0]}14` },
            }}
          />
          <Chip
            label={`Ver todos (${allAthletes.length})`}
            size="small"
            onClick={() => setShowAll(true)}
            sx={{
              fontSize: '0.72rem',
              height: 24,
              backgroundColor: showAll ? `${primary[500]}26` : `${surface[0]}0A`,
              color: showAll ? primary[500] : surface[400],
              border: `1px solid ${showAll ? primary[500] : surface[700]}`,
              cursor: 'pointer',
              '&:hover': { backgroundColor: showAll ? `${primary[500]}33` : `${surface[0]}14` },
            }}
          />

          {showAll && (
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: semantic.warning[500],
                ml: 0.5,
              }}
            >
              Visualizando todos os atletas — use o filtro &lsquo;Em foco&rsquo; para melhor performance
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Calendar grid ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '200px repeat(7, minmax(80px, 1fr))',
            minWidth: 760,
          }}
        >
          {/* Column headers */}
          {/* Athlete header cell */}
          <Box
            sx={{
              px: 1,
              py: 0.75,
              borderBottom: `1px solid ${surface[700]}`,
              borderRight: `1px solid ${surface[700]}`,
              backgroundColor: elevation.highest,
              position: 'sticky',
              left: 0,
              top: 0,
              zIndex: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: surface[400], fontWeight: 600 }}>
              Atleta
            </Typography>
          </Box>

          {/* Day header cells */}
          {weekDates.map((date, idx) => {
            const isCurrentDay = date === todayStr;
            const dayNum = new Date(date + 'T12:00:00').getDate();

            return (
              <Box
                key={date}
                sx={{
                  px: 0.5,
                  py: 0.75,
                  borderBottom: `1px solid ${surface[700]}`,
                  borderRight: `1px solid ${surface[700]}`,
                  backgroundColor: isCurrentDay ? `${primary[500]}18` : elevation.highest,
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: isCurrentDay ? primary[500] : surface[400],
                    lineHeight: 1.2,
                  }}
                >
                  {DAY_LABELS[idx]}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrentDay ? 700 : 400,
                    color: isCurrentDay ? primary[500] : surface[300],
                    lineHeight: 1.2,
                  }}
                >
                  {dayNum}
                </Typography>
              </Box>
            );
          })}

          {/* Athlete rows */}
          {displayedAthletes.map((athlete) => {
            const byDate = workoutMaps.get(athlete.id) ?? new Map<string, MockWorkout>();
            return (
              <CalendarGridRow
                key={athlete.id}
                athlete={athlete}
                weekDates={weekDates}
                workoutsByDate={byDate}
              />
            );
          })}
        </Box>

        {displayedAthletes.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 6,
            }}
          >
            <Typography sx={{ color: surface[500], fontSize: '0.875rem' }}>
              Nenhum atleta em foco esta semana
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
