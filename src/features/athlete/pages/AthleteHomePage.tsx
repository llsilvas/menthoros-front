import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { TodayHeroCard } from '../components/TodayHeroCard';
import { ReadinessCard } from '../components/ReadinessCard';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import type { QuickCheckInData } from '../components/QuickCheckInModal';
import {
  buildHomeMetrics,
  buildNextWorkout,
  homeWorkoutType,
  timeOfDayNow,
  type HomeMetric,
} from '../adapters/homeAdapter';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useUserInfo } from '../../../hooks/useUserInfo';
import { glassSx, surface, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { ROUTES } from '../../../constants/routes';

// Copy de UI (não é dado do atleta): saudação/tom do hero. Ver D0.3 da change.
const MENSAGEM_HERO = 'Consistência constrói sua base. Bons treinos hoje.';

// ── MetricCard (local, não exportado) ────────────────────────────────────────

function MetricCard({ label, value, unit, tooltip }: HomeMetric) {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box sx={{ ...glassSx, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, cursor: 'default' }}>
        <Typography sx={{ color: surface[400], fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{ color: surface[50], fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography sx={{ color: surface[500], fontSize: '0.8rem', fontWeight: 600 }}>{unit}</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

// ── AthleteHomePage ───────────────────────────────────────────────────────────

export default function AthleteHomePage() {
  const navigate = useNavigate();
  const { name } = useUserInfo();
  const { home, loading, error, fetchHome } = useAthleteHome();
  const { readiness, error: readinessError, fetchReadiness } = useAthleteReadiness();
  const [checkInOpen, setCheckInOpen] = useState(false);

  useEffect(() => {
    fetchHome();
    fetchReadiness();
  }, [fetchHome, fetchReadiness]);

  function handleCheckInSubmit(data: QuickCheckInData) {
    // Fora de escopo desta change: ligar o check-in rápido ao endpoint da 9k.
    console.log('QuickCheckIn submitted:', data);
    setCheckInOpen(false);
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchHome}>Tentar novamente</Button>}>
          Não foi possível carregar seu resumo de hoje.
        </Alert>
      </Box>
    );
  }

  if (loading && !home) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const athleteName = name?.trim().split(/\s+/)[0] ?? 'Atleta';
  const nextWorkout = buildNextWorkout(home);
  const metrics = buildHomeMetrics(home?.metricasChave);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TodayHeroCard
        athleteName={athleteName}
        workoutType={homeWorkoutType(home)}
        timeOfDay={timeOfDayNow()}
        motivationalMessage={MENSAGEM_HERO}
        nextWorkout={nextWorkout}
        primaryActionLabel="Iniciar treino"
        onPrimaryAction={() => setCheckInOpen(true)}
      />

      {readinessError ? (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchReadiness}>Recarregar</Button>}
        >
          Prontidão indisponível no momento.
        </Alert>
      ) : (
        readiness?.score != null && (
          <ReadinessCard score={readiness.score} recommendation={readiness.nota} />
        )
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography sx={{ color: surface[50], fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Métricas de hoje
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </Box>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        onClick={() => navigate(ROUTES.ATHLETE_TRAINING_LOG)}
        sx={{ borderColor: primary[500], color: primary[500], fontWeight: 700, py: 1.5, '&:hover': { borderColor: primary[400], bgcolor: `${primary[500]}14` } }}
      >
        Registrar treino de hoje
      </Button>

      <QuickCheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} onSubmit={handleCheckInSubmit} />
    </Box>
  );
}
