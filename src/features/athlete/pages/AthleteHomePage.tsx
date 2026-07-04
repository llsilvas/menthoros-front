import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Tooltip, Typography } from '@mui/material';
import { LocalFireDepartment as StreakIcon, Flag as ProvaIcon } from '@mui/icons-material';
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
import { calcularStreakSemanas } from '../adapters/streakAdapter';
import { buildProximaProva } from '../adapters/provasAdapter';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useCheckinAtual } from '../../../hooks/useCheckinAtual';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useRegistrarCheckin } from '../../../hooks/useRegistrarCheckin';
import { useUserInfo } from '../../../hooks/useUserInfo';
import { glassSx, surface, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { ROUTES } from '../../../constants/routes';

const STREAK_DIAS = 30; // ~4 semanas cheias, mesma janela usada pelo KPI de volume da 9.6

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
  const { recentes: treinos, fetchError: treinosError, fetchRecentes: fetchTreinos } = useManualTraining(STREAK_DIAS);
  const { provas, loading: provasLoading, error: provasError, fetchProvas } = useAthleteProvas();
  const { registrar, loading: registrando, error: registrarError } = useRegistrarCheckin();
  const { checkinHoje, error: checkinAtualError, fetchCheckinAtual } = useCheckinAtual();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [finalizandoCheckIn, setFinalizandoCheckIn] = useState(false);

  useEffect(() => {
    fetchHome();
    fetchReadiness();
    fetchTreinos();
    fetchProvas();
    fetchCheckinAtual();
  }, [fetchHome, fetchReadiness, fetchTreinos, fetchProvas, fetchCheckinAtual]);

  async function handleCheckInSubmit(data: QuickCheckInData) {
    await registrar(data);
    // `registrando` já volta a false aqui (registrar() resolveu) — mantém o botão desabilitado
    // até o modal realmente fechar, para não permitir um segundo POST nesta janela.
    setFinalizandoCheckIn(true);
    try {
      // Refetch aguardado antes de fechar — evita mostrar o score de prontidão desatualizado
      // por uma corrida entre fechar o modal e o novo dado chegar (design.md R3).
      await fetchReadiness();
      await fetchCheckinAtual();
      setCheckInOpen(false);
    } finally {
      setFinalizandoCheckIn(false);
    }
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
  const streak = calcularStreakSemanas(treinos);
  const proximaProva = provasLoading || provasError ? null : buildProximaProva(provas);
  const checkInInitialData: QuickCheckInData | undefined = checkinHoje
    ? {
        qualidadeSono: checkinHoje.qualidadeSono,
        humor: checkinHoje.humor,
        doresMusculares: checkinHoje.doresMusculares,
        nivelEnergia: checkinHoje.nivelEnergia,
        estresse: checkinHoje.estresse,
        observacoes: checkinHoje.observacoes,
      }
    : undefined;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TodayHeroCard
        athleteName={athleteName}
        workoutType={homeWorkoutType(home)}
        timeOfDay={timeOfDayNow()}
        motivationalMessage={MENSAGEM_HERO}
        nextWorkout={nextWorkout}
        primaryActionLabel={checkinHoje ? 'Editado hoje' : 'Iniciar treino'}
        onPrimaryAction={() => setCheckInOpen(true)}
      />

      {checkinAtualError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchCheckinAtual}>Recarregar</Button>}
        >
          Não foi possível confirmar se você já fez o check-in de hoje.
        </Alert>
      )}

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

      {treinosError ? (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchTreinos}>Recarregar</Button>}
        >
          Não foi possível carregar seu streak de treinos.
        </Alert>
      ) : (
        streak > 0 && (
          <Box sx={{ ...glassSx, borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StreakIcon sx={{ color: primary[500], fontSize: 28 }} />
            <Typography sx={{ color: surface[50], fontWeight: 700 }}>
              {streak} {streak === 1 ? 'semana seguida' : 'semanas seguidas'} treinando
            </Typography>
          </Box>
        )
      )}

      {provasError ? (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchProvas}>Recarregar</Button>}
        >
          Não foi possível carregar sua próxima prova.
        </Alert>
      ) : (
        !provasLoading && (
          <Box sx={{ ...glassSx, borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ProvaIcon sx={{ color: primary[500], fontSize: 28 }} />
            <Typography sx={{ color: surface[50], fontWeight: 700 }}>
              {proximaProva
                ? (proximaProva.diasFaltando != null
                    ? `Faltam ${proximaProva.diasFaltando} ${proximaProva.diasFaltando === 1 ? 'dia' : 'dias'} para ${proximaProva.nomeProva}`
                    : `Sua próxima meta: ${proximaProva.nomeProva}`)
                : 'Sem próxima meta cadastrada — peça ao seu coach para cadastrar sua próxima prova.'}
            </Typography>
          </Box>
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

      <QuickCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
        initialData={checkInInitialData}
        submitting={registrando || finalizandoCheckIn}
        error={registrarError ? 'Não foi possível salvar seu check-in. Tente novamente.' : undefined}
      />
    </Box>
  );
}
