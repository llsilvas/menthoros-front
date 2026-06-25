import { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { content, primary, surface } from '../../../theme/tokens';
import type { CoachCalendario, TreinoAgendado } from '../../../types/Coach';
import { formatDashboardDate, formatWorkoutTypeLabel } from './coachInboxHelpers';
import { SectionCard } from './SectionCard';

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

function buildWeekDates(mondayIso: string): string[] {
  const start = new Date(`${mondayIso}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day.toLocaleDateString('sv-SE');
  });
}

interface DashboardCalendarPanelProps {
  calendario: CoachCalendario;
  onOpenCalendar: () => void;
}

export function DashboardCalendarPanel({ calendario, onOpenCalendar }: DashboardCalendarPanelProps) {
  const weekDates = useMemo(() => buildWeekDates(calendario.semanaInicio), [calendario.semanaInicio]);
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, CoachCalendario['treinos']>();
    for (const workout of calendario.treinos) {
      const current = (map.get(workout.data) ?? []) as CoachCalendario['treinos'];
      current.push(workout);
      map.set(workout.data, current);
    }
    return map;
  }, [calendario.treinos]);

  return (
    <SectionCard
      title="Calendário semanal do dashboard"
      action={
        <Button size="small" sx={{ textTransform: 'none' }} onClick={onOpenCalendar}>
          Abrir calendário
        </Button>
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(7, minmax(0, 1fr))' }, gap: 1 }}>
        {weekDates.map((date, index) => {
          const dayWorkouts: TreinoAgendado[] = workoutsByDate.get(date) ?? [];
          return (
            <Box
              key={date}
              sx={{
                p: 1,
                borderRadius: 1.5,
                border: `1px solid ${content.cardBorder}`,
                backgroundColor: `${surface[0]}06`,
                minHeight: 110,
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', color: surface[400], fontWeight: 700 }}>
                {DAY_LABELS[index]}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: surface[200], mt: 0.1 }}>
                {formatDashboardDate(date)}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                {dayWorkouts.slice(0, 2).map((workout, workoutIndex) => (
                  <Box
                    key={`${date}-${workoutIndex}-${workout.atletaId ?? workout.nomeAtleta ?? 'treino'}`}
                    sx={{
                      px: 0.75,
                      py: 0.55,
                      borderRadius: 1,
                      border: `1px solid ${content.cardBorder}`,
                      backgroundColor: `${primary[500]}12`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.74rem', color: surface[50], fontWeight: 700 }} noWrap>
                      {workout.nomeAtleta ?? 'Atleta'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: surface[300] }} noWrap>
                      {formatWorkoutTypeLabel(workout.tipoTreino)}
                    </Typography>
                  </Box>
                ))}
                {dayWorkouts.length > 2 ? (
                  <Typography sx={{ fontSize: '0.7rem', color: surface[400] }}>
                    +{dayWorkouts.length - 2} outros treinos
                  </Typography>
                ) : null}
                {dayWorkouts.length === 0 ? (
                  <Typography sx={{ fontSize: '0.72rem', color: surface[400] }}>Sem treinos</Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </SectionCard>
  );
}
