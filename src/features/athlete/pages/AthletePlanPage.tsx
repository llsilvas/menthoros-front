import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { EventNote as PlanIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { WeeklyPlanList } from '../components/WeeklyPlanList';
import { buildWeeklyPlan, weekDatesFromInicio } from '../adapters/buildWeeklyPlan';
import { useAthletePlan } from '../../../hooks/useAthletePlan';

function formatWeekRange(dates: Date[]): string {
  const first = dates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const last = dates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${first} – ${last}`;
}

export default function AthletePlanPage() {
  const { plano, loading, error, fetchPlano } = useAthletePlan();

  useEffect(() => {
    fetchPlano();
  }, [fetchPlano]);

  const weekDates = useMemo(
    () => (plano ? weekDatesFromInicio(plano.semanaInicio) : []),
    [plano],
  );
  const week = useMemo(() => buildWeeklyPlan(plano, weekDates), [plano, weekDates]);

  const handleDayPress = useCallback(() => {
    // Futuramente: abrir detalhe do treino.
  }, []);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Título */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PlanIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Plano da Semana
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            {plano ? formatWeekRange(weekDates) : 'Treinos aprovados pelo seu coach'}
          </Typography>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchPlano}>Tentar novamente</Button>}>
          Não foi possível carregar seu plano da semana.
        </Alert>
      ) : loading && !plano ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : !plano ? (
        <Box sx={{ textAlign: 'center', color: surface[400], px: 3, py: 8 }}>
          <Typography sx={{ color: surface[200], fontWeight: 600, mb: 1 }}>
            Seu coach ainda não aprovou o plano desta semana
          </Typography>
          <Typography variant="body2">
            Assim que o plano for aprovado, ele aparece aqui com os treinos da semana.
          </Typography>
        </Box>
      ) : (
        <WeeklyPlanList
          week={week}
          total={Math.round(plano.volumeRealizadoKm)}
          target={Math.round(plano.volumePlanejadoKm)}
          unitLabel="km"
          weekLabel={plano.objetivoSemanal}
          onDayPress={handleDayPress}
        />
      )}
    </Box>
  );
}
