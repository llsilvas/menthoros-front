import { useEffect, useMemo, useState } from 'react';
import { addDays, addWeeks, format, parseISO, startOfISOWeek } from 'date-fns';
import { Alert, Box, Button, ButtonGroup, CircularProgress, Tooltip, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { primary, surface, semantic, categorical } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { useCoachCalendar } from '../../../hooks/useCoachCalendar';
import { groupCalendarByAtleta, type CoachCalendarRow, type CoachWorkout } from '../adapters/calendarAdapter';
import type { WorkoutType } from '../adapters/workoutType';

// ── Week helpers ──────────────────────────────────────────────────────────────

/** Datas (seg→dom) da semana com o `offset` informado, em ISO `yyyy-MM-dd` (referência local). */
function getWeekDates(offset = 0): string[] {
  const monday = addWeeks(startOfISOWeek(new Date()), offset);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

/** 7 datas (seg→dom) a partir da segunda informada pelo backend (`semanaInicio`). */
function datesFromMonday(mondayIso: string): string[] {
  const monday = parseISO(mondayIso);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

function formatWeekRange(dates: string[]): string {
  const first = parseISO(dates[0]);
  const last = parseISO(dates[6]);
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  const locale = 'pt-BR';
  const firstStr = first.toLocaleDateString(locale, opts);
  const lastStr = last.toLocaleDateString(locale, { ...opts, year: 'numeric' });
  return `${firstStr} – ${lastStr}`;
}

function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ── Workout color/label maps (categorical tokens only) ─────────────────────────

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

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ── WorkoutBlock ──────────────────────────────────────────────────────────────

function WorkoutBlock({ workout }: { workout: CoachWorkout }) {
  const color = WORKOUT_COLORS[workout.type];
  const label = WORKOUT_LABEL[workout.type];

  return (
    <Tooltip title={label} placement="top" arrow>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '4px',
          p: '3px 4px',
          fontSize: '0.7rem',
          lineHeight: 1.3,
          backgroundColor: `${color}26`,
          border: workout.isKeyWorkout ? `2px solid ${color}` : `1px solid ${color}66`,
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
        {workout.isKeyWorkout && <StarIcon sx={{ fontSize: '0.65rem', flexShrink: 0 }} />}
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
        {workout.hasAlert && (
          <WarningIcon sx={{ fontSize: '0.65rem', color: semantic.warning[500], flexShrink: 0 }} />
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
  row: CoachCalendarRow;
  weekDates: string[];
  todayStr: string;
  workoutsByDate: Map<string, CoachWorkout>;
}

function CalendarGridRow({ row, weekDates, todayStr, workoutsByDate }: CalendarGridRowProps) {
  return (
    <Box sx={{ display: 'contents' }}>
      {/* Athlete name cell — só nome + avatar (sem phase/status: o calendário não traz, D6) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
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
        <CoachAthleteAvatar athlete={{ id: row.atletaId, name: row.nomeAtleta }} size="xs" status="none" />
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: surface[50],
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={row.nomeAtleta}
        >
          {row.nomeAtleta}
        </Typography>
      </Box>

      {/* Day cells */}
      {weekDates.map((date) => {
        const workout = workoutsByDate.get(date);
        const isCurrentDay = date === todayStr;

        return (
          <Box
            key={date}
            sx={{
              px: 0.5,
              py: 0.5,
              borderBottom: `1px solid ${surface[700]}`,
              borderRight: `1px solid ${surface[700]}`,
              backgroundColor: isCurrentDay ? `${primary[500]}08` : 'transparent',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {workout != null ? <WorkoutBlock workout={workout} /> : null}
          </Box>
        );
      })}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoachCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const localWeekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const { calendario, loading, error, fetchCalendario } = useCoachCalendar();
  useEffect(() => {
    fetchCalendario(localWeekDates[0]);
  }, [fetchCalendario, localWeekDates]);

  // Colunas alinhadas à semana que o backend de fato retornou; placeholder local até carregar.
  const weekDates = useMemo(
    () => (calendario ? datesFromMonday(calendario.semanaInicio) : localWeekDates),
    [calendario, localWeekDates],
  );
  const weekLabel = useMemo(() => formatWeekRange(weekDates), [weekDates]);
  const todayStr = getTodayStr();
  const isCurrentWeek = weekOffset === 0;

  const rows = useMemo(() => (calendario ? groupCalendarByAtleta(calendario) : []), [calendario]);

  // athleteId → (date → workout)
  const workoutMaps = useMemo(() => {
    const map = new Map<string, Map<string, CoachWorkout>>();
    for (const row of rows) {
      const byDate = new Map<string, CoachWorkout>();
      for (const w of row.workouts) byDate.set(w.date, w);
      map.set(row.atletaId, byDate);
    }
    return map;
  }, [rows]);

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
      {/* ── Header: navegação de semana ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${surface[700]}`,
          backgroundColor: elevation.panel,
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
          sx={{ fontSize: '0.9rem', fontWeight: 600, color: surface[50], minWidth: 160, textAlign: 'center' }}
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

      {/* ── Conteúdo: erro / carregando / grade ── */}
      {error ? (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => fetchCalendario(localWeekDates[0])}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar o calendário da semana.
          </Alert>
        </Box>
      ) : loading && !calendario ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '200px repeat(7, minmax(80px, 1fr))',
              minWidth: 760,
            }}
          >
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
              const dayNum = parseISO(date).getDate();

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
            {rows.map((row) => (
              <CalendarGridRow
                key={row.atletaId}
                row={row}
                weekDates={weekDates}
                todayStr={todayStr}
                workoutsByDate={workoutMaps.get(row.atletaId) ?? new Map<string, CoachWorkout>()}
              />
            ))}
          </Box>

          {rows.length === 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
              <Typography sx={{ color: surface[500], fontSize: '0.875rem' }}>
                Nenhum treino planejado nesta semana
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
