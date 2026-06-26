import { Box, Button, Chip, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { content, primary, semantic, surface } from '../../../../theme/tokens';
import { SectionCard } from '../SectionCard';
import { RecentSuggestionsPanel } from '../RecentSuggestionsPanel';
import { ACTION_BTN_END_ICON_SX, ACTION_BTN_SX } from '../actionButtonSx';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { AtletaPerfilCoachDto } from '../../../../types/AtletaPerfilCoach';

interface ReviewTabPanelProps {
  selected: CoachAthleteRow;
  selectedProfile: AtletaPerfilCoachDto | null;
  onMarkDone: () => void;
  onReagendar: () => void;
  onOpenCalendar: () => void;
}

export function ReviewTabPanel({ selected, selectedProfile, onMarkDone, onReagendar, onOpenCalendar }: ReviewTabPanelProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.08fr 0.92fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 1.35 } }}>
      <SectionCard
        title="Próximo treino"
        action={
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{ ...ACTION_BTN_END_ICON_SX, px: { xs: 0.75, xl: 1 } }}
            onClick={onOpenCalendar}
          >
            Ver calendário completo
          </Button>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 0.95, xl: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: { xs: '0.92rem', sm: '0.96rem', lg: '1rem', xl: '1.1rem' }, fontWeight: 700, color: surface[50] }}>{selected.nextWorkout.title}</Typography>
              <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', lg: '0.8rem', xl: '0.86rem' }, color: surface[400], mt: 0.2 }}>
                {selected.nextWorkout.when} · {selected.nextWorkout.duration} - {selected.nextWorkout.distance}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
            <Chip
              size="small"
              label={selected.planStatus === 'ATRASADO' ? 'Atrasado' : selected.planStatus === 'NO_PRAZO' ? 'No prazo' : 'Concluído'}
              sx={{
                bgcolor: selected.planStatus === 'ATRASADO' ? `${semantic.danger[500]}14` : selected.planStatus === 'NO_PRAZO' ? `${primary[500]}16` : `${semantic.success[500]}16`,
                color: selected.planStatus === 'ATRASADO' ? semantic.danger[500] : selected.planStatus === 'NO_PRAZO' ? primary[500] : semantic.success[500],
                border: `1px solid ${selected.planStatus === 'ATRASADO' ? semantic.danger[500] : selected.planStatus === 'NO_PRAZO' ? primary[500] : semantic.success[500]}44`,
                fontWeight: 700,
              }}
            />
            </Box>
          </Box>

          <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.9rem', color: surface[100], lineHeight: 1.45 }}>
            {selected.nextWorkout.objective}
          </Typography>

          <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.78rem', color: surface[400] }}>
            Estrutura sugerida: {selected.nextWorkout.title} em {selected.nextWorkout.zone} com atenção ao frescor.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.6, xl: 1 } }}>
            <Button
              variant="contained"
              onClick={onMarkDone}
              disabled={selected.decision !== 'PENDING'}
              size="small"
              sx={{
                bgcolor: semantic.success[500],
                color: '#fff',
                textTransform: 'none',
                fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                px: { xs: 1, xl: 1.5 },
                '&:hover': { bgcolor: semantic.success[700] },
                '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
              }}
            >
              Marcar como concluído
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onReagendar}
              sx={{ ...ACTION_BTN_SX, px: { xs: 1, xl: 1.5 } }}
            >
              Reagendar
            </Button>
          </Box>
        </Box>
      </SectionCard>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
        <SectionCard title="Últimos treinos">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.65, sm: 0.75, lg: 0.9, xl: 1.05 } }}>
            {selected.lastWorkouts.map((workout) => (
              <Box
                key={`${selected.id}-${workout.date}`}
                sx={{
                  p: { xs: 0.72, sm: 0.82, lg: 0.92, xl: 1.05 },
                  borderRadius: 1.5,
                  border: `1px solid ${content.cardBorder}`,
                  backgroundColor: `${surface[0]}06`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: { xs: 0.8, sm: 0.9, lg: 1, xl: 1.3 },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: { xs: '0.63rem', sm: '0.67rem', lg: '0.7rem', xl: '0.76rem' }, color: surface[400] }}>{workout.date}</Typography>
                  <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', lg: '0.8rem', xl: '0.86rem' }, fontWeight: 600, color: surface[50] }}>{workout.title}</Typography>
                  <Typography sx={{ fontSize: { xs: '0.63rem', sm: '0.67rem', lg: '0.7rem', xl: '0.76rem' }, color: surface[400] }}>
                    {workout.zone} · {workout.distance}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${workout.completion}%`}
                  sx={{
                    color:
                      workout.state === 'ok'
                        ? semantic.success[500]
                        : workout.state === 'warn'
                          ? semantic.warning[500]
                          : semantic.danger[500],
                    bgcolor:
                      workout.state === 'ok'
                        ? `${semantic.success[500]}12`
                        : workout.state === 'warn'
                          ? `${semantic.warning[500]}12`
                          : `${semantic.danger[500]}12`,
                    border: `1px solid ${
                      workout.state === 'ok'
                        ? semantic.success[500]
                        : workout.state === 'warn'
                          ? semantic.warning[500]
                          : semantic.danger[500]
                    }44`,
                  }}
                />
              </Box>
            ))}
          </Box>
        </SectionCard>

        <SectionCard title="Sugestões recentes">
          <RecentSuggestionsPanel
            sugestoes={selectedProfile?.sugestoesRecentes ?? []}
            onVerTodas={() => {}}
          />
        </SectionCard>
      </Box>
    </Box>
  );
}
