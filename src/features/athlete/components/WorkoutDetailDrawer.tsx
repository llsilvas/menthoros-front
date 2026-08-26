import { useMemo } from 'react';
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { WorkoutProfile, selectWorkoutProfile, fromEtapaTreino } from '../../workout/profile';
import { indexarRepeticoes } from '../../workout/profile/input';
import { getSafeValue } from '../../../utils/safeValues';
import type { AgendaDay } from '../adapters/buildWeekAgenda';

export interface WorkoutDetailDrawerProps {
  dia: AgendaDay | null;
  onClose: () => void;
  onRegister: () => void;
}

/**
 * Detalhe do treino (design D2, treino com etapas): descrição, etapas e o mesmo `WorkoutProfile`
 * que o coach vê no `DetalheTreinoDialog`. O índice das repetições é derivado por
 * `indexarRepeticoes` — o contrato não o envia e o backend persiste a série já expandida.
 */
export function WorkoutDetailDrawer({ dia, onClose, onRegister }: WorkoutDetailDrawerProps) {
  const treino = dia?.workout?.treino ?? null;
  const etapas = useMemo(() => [...(treino?.etapas ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)), [treino]);
  const profile = useMemo(() => {
    if (!treino || etapas.length === 0) return null;
    return selectWorkoutProfile(indexarRepeticoes(etapas.map(fromEtapaTreino)), {
      // O esporte não existe no contrato (mesma limitação do detalhe do coach): escala de corrida.
      sport: 'run',
      tss: treino.tssPlanejado ?? null,
      if: treino.intensidadePlanejada ?? null,
      zonaAlvoTreino: treino.zonaAlvo ?? null,
    });
  }, [treino, etapas]);

  const aberto = dia !== null && treino !== null;

  return (
    <Drawer anchor="bottom" open={aberto} onClose={onClose} PaperProps={{ sx: { bgcolor: elevation.panel, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90vh' } }}>
      {aberto && dia.workout && (
        <Box sx={{ p: 2, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="overline" sx={{ color: surface[400] }}>
                {format(dia.date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </Typography>
              <Typography variant="h4">{dia.workout.title}</Typography>
            </Box>
            <IconButton aria-label="Fechar" onClick={onClose} sx={{ color: surface[400] }}><CloseIcon /></IconButton>
          </Box>

          {dia.workout.description && (
            <Typography variant="body1" sx={{ color: surface[300] }}>{dia.workout.description}</Typography>
          )}

          {profile && <WorkoutProfile profile={profile} variant="full" />}

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {etapas.map((e, i) => (
              <Box key={e.id ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < etapas.length - 1 ? `1px solid ${surface[700]}` : 'none' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{e.descricaoEtapa || getSafeValue(e.tipoEtapa)}</Typography>
                  {(e.fcAlvoEtapa || e.ritmoAlvo) && (
                    <Typography variant="body2" sx={{ color: surface[400] }}>{[e.fcAlvoEtapa, e.ritmoAlvo].filter(Boolean).join(' · ')}</Typography>
                  )}
                </Box>
                {e.duracaoMin != null && (
                  <Typography variant="body1" sx={{ fontFamily: (t) => t.typography.h6.fontFamily, fontWeight: 600 }}>{e.duracaoMin} min</Typography>
                )}
              </Box>
            ))}
          </Box>

          {dia.status === 'hoje' && (
            <Button variant="contained" fullWidth onClick={onRegister} sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 48, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}>
              Registrar treino
            </Button>
          )}
        </Box>
      )}
    </Drawer>
  );
}

export default WorkoutDetailDrawer;
