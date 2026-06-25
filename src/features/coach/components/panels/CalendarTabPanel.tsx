import { Box, Button, Chip, Typography } from '@mui/material';
import { content, primary, semantic, surface } from '../../../../theme/tokens';
import { DashboardCalendarPanel } from '../DashboardCalendarPanel';
import { SectionCard } from '../SectionCard';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { CoachCalendario } from '../../../../types/Coach';

interface CalendarTabPanelProps {
  dashboardCalendar: CoachCalendario | null;
  selected: CoachAthleteRow;
  onOpenCalendar: () => void;
}

export function CalendarTabPanel({ dashboardCalendar, selected, onOpenCalendar }: CalendarTabPanelProps) {
  if (dashboardCalendar) {
    return <DashboardCalendarPanel calendario={dashboardCalendar} onOpenCalendar={onOpenCalendar} />;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 0.95fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
      <SectionCard
        title="Calendário de provas"
        action={
          <Button size="small" sx={{ textTransform: 'none' }} onClick={onOpenCalendar}>
            Ver calendário completo
          </Button>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 0.95, xl: 1.1 } }}>
          {selected.raceCalendar.map((race) => (
            <Box
              key={`${selected.id}-${race.date}`}
              sx={{
                p: { xs: 0.8, sm: 0.9, lg: 1, xl: 1.2 },
                borderRadius: 1.5,
                border: `1px solid ${content.cardBorder}`,
                backgroundColor: `${surface[0]}06`,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.85, sm: 0.95, lg: 1, xl: 1.2 },
              }}
            >
              <Box
                sx={{
                  width: { xs: 44, sm: 48, lg: 52, xl: 60 },
                  height: { xs: 44, sm: 48, lg: 52, xl: 60 },
                  borderRadius: 1.5,
                  border: `1px solid ${content.cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${surface[0]}10`,
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: surface[400], fontWeight: 700 }}>{race.date.split(' ')[0]}</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: surface[200], fontWeight: 700 }}>{race.date.split(' ')[1]}</Typography>
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: { xs: '0.74rem', sm: '0.8rem', lg: '0.84rem', xl: '0.9rem' }, fontWeight: 700, color: surface[50] }} noWrap>
                  {race.label}
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.68rem', lg: '0.72rem', xl: '0.78rem' }, color: surface[400] }}>Prova {race.tag.toLowerCase()}</Typography>
              </Box>
              <Chip
                size="small"
                label={race.tag}
                sx={{
                  bgcolor: race.tag === 'ALVO' ? `${semantic.success[500]}14` : race.tag === 'PRINCIPAL' ? `${primary[500]}14` : `${surface[500]}14`,
                  color: race.tag === 'ALVO' ? semantic.success[500] : race.tag === 'PRINCIPAL' ? primary[500] : surface[300],
                }}
              />
            </Box>
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="Semana atual">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(4, minmax(0, 1fr))', xl: 'repeat(7, minmax(0, 1fr))' }, gap: 0.65 }}>
          {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day, index) => (
            <Box
              key={day}
              sx={{
                p: { xs: 0.7, sm: 0.8, lg: 0.9, xl: 1 },
                borderRadius: 1.5,
                border: `1px solid ${index === 5 ? primary[500] : content.cardBorder}`,
                bgcolor: index === 5 ? `${primary[500]}12` : `${surface[0]}06`,
                minHeight: { xs: 70, sm: 76, lg: 82, xl: 88 },
              }}
            >
              <Typography sx={{ fontSize: '0.62rem', color: surface[400], fontWeight: 700 }}>{day}</Typography>
              <Typography sx={{ mt: 0.32, fontSize: { xs: '0.82rem', sm: '0.88rem', lg: '0.9rem', xl: '0.95rem' }, color: surface[50], fontWeight: 700 }}>{24 + index}</Typography>
              <Typography sx={{ mt: 0.7, fontSize: { xs: '0.62rem', sm: '0.66rem', lg: '0.68rem', xl: '0.72rem' }, color: surface[300] }}>
                {index === 0
                  ? 'Fácil 8 km'
                  : index === 1
                    ? 'Força geral'
                    : index === 2
                      ? 'Limiar'
                      : index === 3
                        ? 'Descanso'
                        : index === 4
                          ? 'Tiros'
                          : index === 5
                            ? 'Longão'
                            : 'Recuperação'}
              </Typography>
            </Box>
          ))}
        </Box>
      </SectionCard>
    </Box>
  );
}
