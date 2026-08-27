import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { surface } from '../../../theme/tokens';
import { primary } from '../../../theme/tokens';
import { WorkoutProfile } from '../../workout/profile';
import { buildTodayWorkoutProfile, formatAlvoEtapa } from '../adapters/buildTodayWorkoutProfile';
import { tipoTreinoLabel } from '../adapters/homeAdapter';
import { SkipWorkoutDialog } from '../components/SkipWorkoutDialog';
import { useTodayWorkout } from '../hooks/useTodayWorkout';
import { ROUTES } from '../../../constants/routes';
import type { MotivoPulo } from '../../../types/AthleteWorkoutToday';

const MOTIVO_LABELS: Record<MotivoPulo, string> = {
  SEM_TEMPO: 'sem tempo', CANSADO: 'cansaço', DOR: 'dor', OUTRO: 'outro motivo',
};

export default function AthleteWorkoutPage() {
  const navigate = useNavigate();
  const { treino, loading, error, fetchTreino, pular, pulando, pularError } = useTodayWorkout();
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    fetchTreino();
  }, [fetchTreino]);

  const registrar = () =>
    navigate(ROUTES.ATHLETE_TRAINING_LOG, {
      state: { tipo: treino?.tipoTreino, duracaoMinutos: treino?.duracaoMin },
    });

  const confirmarPulo = async (motivo?: MotivoPulo) => {
    await pular(motivo);
    setDialogAberto(false);
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchTreino}>Tentar novamente</Button>}>
          Não foi possível carregar o treino de hoje.
        </Alert>
      </Box>
    );
  }

  if (loading && !treino) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!treino) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: surface[400] }}>
        <Typography variant="subtitle1" sx={{ color: surface[200], mb: 1 }}>
          Nenhum treino planejado para hoje
        </Typography>
        <Typography variant="body2">Se fizer algo, registre — conta na semana.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={registrar}>Registrar treino</Button>
      </Box>
    );
  }

  if (treino.statusTreino === 'PERDIDO') {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4">Você pulou hoje</Typography>
        <Typography variant="body1" sx={{ color: surface[300] }}>
          {treino.motivoPulo && (MOTIVO_LABELS as Record<string, string>)[treino.motivoPulo]
            ? `Motivo: ${(MOTIVO_LABELS as Record<string, string>)[treino.motivoPulo]}.`
            : 'Sem motivo registrado.'}{' '}
          Seu coach vê isso no plano da semana.
        </Typography>
        <Button variant="contained" onClick={registrar} sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 48, fontWeight: 700 }}>
          Registrar mesmo assim
        </Button>
      </Box>
    );
  }

  const profile = buildTodayWorkoutProfile(treino.etapas, { zonaAlvo: treino.zonaAlvo });
  const etapas = [...(treino.etapas ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="overline" sx={{ color: surface[400] }}>Hoje</Typography>
          <Typography variant="h3">{tipoTreinoLabel(treino.tipoTreino)}</Typography>
          {treino.descricao && (
            <Typography variant="body1" sx={{ color: surface[300] }}>{treino.descricao}</Typography>
          )}
        </Box>

        {pularError && <Alert severity="error">Não foi possível registrar o pulo. Tente novamente.</Alert>}

        {profile && <WorkoutProfile profile={profile} variant="full" />}

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {etapas.map((e, i) => {
            const alvo = formatAlvoEtapa(e);
            return (
              <Box
                key={e.blocoId ? `${e.blocoId}-${e.ordem}` : (e.ordem ?? i)}
                data-testid="workout-today-etapa"
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < etapas.length - 1 ? `1px solid ${surface[700]}` : 'none' }}
              >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{e.descricao || e.tipoEtapa}</Typography>
                  {(alvo || e.textoSecundario) && (
                    <Typography variant="body2" sx={{ color: surface[400] }}>
                      {[alvo, e.textoSecundario].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>
                {e.duracaoMin != null && (
                  <Typography variant="body1" sx={{ fontFamily: (t) => t.typography.h6.fontFamily, fontWeight: 600 }}>
                    {e.duracaoMin} min
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Sticky: em treinos de até 4 etapas as ações cabem sem scroll; acima disso, ficam
          fixas no rodapé enquanto o conteúdo rola por baixo (CA2). */}
      <Box
        data-testid="workout-today-actions"
        sx={{ position: 'sticky', bottom: 0, bgcolor: elevation.base, borderTop: `1px solid ${surface[700]}`, p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={registrar}
          sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 48, fontWeight: 700, borderRadius: radius.lg, '&:hover': { bgcolor: primary[400] } }}
        >
          Concluí o treino
        </Button>
        <Button variant="text" fullWidth onClick={() => setDialogAberto(true)} sx={{ color: surface[400], minHeight: 40 }}>
          Não vou conseguir hoje
        </Button>
      </Box>

      <SkipWorkoutDialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        onConfirm={confirmarPulo}
        submitting={pulando}
        error={pularError ? 'Não foi possível registrar o pulo. Tente novamente.' : undefined}
      />
    </Box>
  );
}
