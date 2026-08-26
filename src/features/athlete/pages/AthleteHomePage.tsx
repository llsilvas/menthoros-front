import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Link, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TodayHeroCard } from '../components/TodayHeroCard';
import { ReadinessCard } from '../components/ReadinessCard';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import type { QuickCheckInData } from '../components/QuickCheckInModal';
import { InlineCheckIn } from '../components/InlineCheckIn';
import { CheckInStatusRow } from '../components/CheckInStatusRow';
import { KudosCard } from '../components/KudosCard';
import { WeekOverviewCard } from '../components/WeekOverviewCard';
import { WeekClosedBanner } from '../components/WeekClosedBanner';
import { CalibrationBanner } from '../components/CalibrationBanner';
import { buildNextWorkout, timeOfDayNow } from '../adapters/homeAdapter';
import { calcularStreakSemanas } from '../adapters/streakAdapter';
import { buildProximaProva } from '../adapters/provasAdapter';
import { buildWeekOverview } from '../adapters/buildWeekOverview';
import { selectWeekClosedInfo } from '../adapters/selectWeekClosedInfo';
import { useInlineCheckin } from '../hooks/useInlineCheckin';
import { useAthleteHome } from '../../../hooks/useAthleteHome';
import { useAthletePlan } from '../../../hooks/useAthletePlan';
import { useCalibracao } from '../../../hooks/useCalibracao';
import { useAthleteReadiness } from '../../../hooks/useAthleteReadiness';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useCheckinAtual } from '../../../hooks/useCheckinAtual';
import { useKudosRecentes } from '../../../hooks/useKudosRecentes';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useRegistrarCheckin } from '../../../hooks/useRegistrarCheckin';
import { useUserInfo } from '../../../hooks/useUserInfo';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { FAIXA_APRESENTACAO } from '../../../types/FaixaTsb';
import { ROUTES } from '../../../constants/routes';
import type { TimeOfDay } from '../../../shared/design-tokens/gradients';

const STREAK_DIAS = 30; // ~4 semanas cheias, mesma janela usada pelo KPI de volume da 9.6

const SAUDACAO: Record<TimeOfDay, string> = { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite', night: 'Boa noite' };

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── AthleteHomePage ───────────────────────────────────────────────────────────

export default function AthleteHomePage() {
  const navigate = useNavigate();
  const { name } = useUserInfo();
  const { home, loading, error, fetchHome } = useAthleteHome();
  const { readiness, error: readinessError, fetchReadiness } = useAthleteReadiness();
  const { recentes: treinos, isFetching: treinosLoading, fetchError: treinosError, fetchRecentes: fetchTreinos } = useManualTraining(STREAK_DIAS);
  const { provas, loading: provasLoading, error: provasError, fetchProvas } = useAthleteProvas();
  const { registrar, loading: registrando, error: registrarError } = useRegistrarCheckin();
  const { checkinHoje, error: checkinAtualError, fetchCheckinAtual } = useCheckinAtual();
  const { kudos, error: kudosError, fetchKudos } = useKudosRecentes();
  const { plano, loading: planoLoading, error: planoError, fetchPlano } = useAthletePlan();
  const { status: calibracaoStatus, justExited: calibracaoJustExited, fetchStatus: fetchCalibracao, dismissJustExited } = useCalibracao();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [inlineAberto, setInlineAberto] = useState(false);
  const [finalizandoCheckIn, setFinalizandoCheckIn] = useState(false);
  // Dispensa apenas na montagem corrente (reaparece ao voltar à Home) — intencional no XS;
  // persistir entre sessões (sessionStorage por semanaFim) é follow-up documentado na proposal.
  const [bannerDispensado, setBannerDispensado] = useState(false);
  const [calibracaoBannerDispensado, setCalibracaoBannerDispensado] = useState(false);

  const inline = useInlineCheckin({
    checkinHoje,
    registrar,
    onSaved: async () => {
      await fetchReadiness();
      await fetchCheckinAtual();
    },
  });

  useEffect(() => {
    fetchHome();
    fetchReadiness();
    fetchTreinos();
    fetchProvas();
    fetchCheckinAtual();
    fetchKudos();
    fetchPlano();
    fetchCalibracao();
  }, [fetchHome, fetchReadiness, fetchTreinos, fetchProvas, fetchCheckinAtual, fetchKudos, fetchPlano, fetchCalibracao]);

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

  const hoje = new Date();
  const athleteName = name?.trim().split(/\s+/)[0] ?? 'Atleta';
  const nextWorkout = buildNextWorkout(home);
  const streak = calcularStreakSemanas(treinos);
  const proximaProva = provasLoading || provasError ? null : buildProximaProva(provas);
  const overview = buildWeekOverview({ plano, treinos, streak, proximaProva, hoje });
  const { semanaEncerrada, treinosPerdidos } = selectWeekClosedInfo(plano);
  const mostrarBannerSemana =
    !planoLoading && !planoError && semanaEncerrada && treinosPerdidos > 0 && !bannerDispensado;
  const faixa = home?.metricasChave?.statusForma;
  const formaLabel = faixa && FAIXA_APRESENTACAO[faixa] ? FAIXA_APRESENTACAO[faixa].label : null;
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
  const mostrarInline = !checkinHoje && inlineAberto;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!calibracaoBannerDispensado && (calibracaoStatus || calibracaoJustExited) && (
        <CalibrationBanner
          status={calibracaoStatus}
          justExited={calibracaoJustExited}
          onDismiss={() => {
            setCalibracaoBannerDispensado(true);
            dismissJustExited();
          }}
        />
      )}

      {mostrarBannerSemana && (
        <WeekClosedBanner
          treinosPerdidos={treinosPerdidos}
          onDismiss={() => setBannerDispensado(true)}
        />
      )}

      {planoError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchPlano}>Recarregar</Button>}
        >
          Não foi possível verificar o status da sua semana.
        </Alert>
      )}

      {/* Cabeçalho: data por extenso e saudação por período (D1) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="overline" sx={{ color: surface[400] }}>
          {capitalizar(format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR }))}
        </Typography>
        <Typography variant="h3">{SAUDACAO[timeOfDayNow()]}, {athleteName}</Typography>
      </Box>

      {checkinAtualError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchCheckinAtual}>Recarregar</Button>}
        >
          Não foi possível confirmar se você já fez o check-in de hoje.
        </Alert>
      )}

      {mostrarInline ? (
        <InlineCheckIn
          selecao={inline.selecao}
          pendentes={inline.pendentes}
          salvo={inline.salvo}
          salvando={inline.salvando}
          error={inline.error}
          onSelecionar={inline.selecionar}
          onMaisDetalhes={() => setCheckInOpen(true)}
        />
      ) : (
        <CheckInStatusRow
          feito={checkinHoje !== null}
          onFazer={() => setInlineAberto(true)}
          onEditar={() => setCheckInOpen(true)}
        />
      )}

      <TodayHeroCard
        nextWorkout={nextWorkout}
        onRegister={() => navigate(ROUTES.ATHLETE_TRAINING_LOG)}
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
          <ReadinessCard score={readiness.score} recommendation={readiness.nota} comCheckinHoje={checkinHoje !== null} />
        )
      )}

      {treinosError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchTreinos}>Recarregar</Button>}
        >
          Não foi possível carregar seu streak de treinos.
        </Alert>
      )}

      {provasError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchProvas}>Recarregar</Button>}
        >
          Não foi possível carregar sua próxima prova.
        </Alert>
      )}

      {!treinosLoading && <WeekOverviewCard overview={overview} provaConhecida={!provasLoading && !provasError} />}

      {kudosError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={<Button color="inherit" size="small" onClick={fetchKudos}>Recarregar</Button>}
        >
          Não foi possível carregar seus reconhecimentos do coach.
        </Alert>
      )}
      <KudosCard kudos={kudos} />

      {/* Forma em linguagem simples; os números (CTL/ATL/TSB) vivem no Progresso (D1) */}
      <Box data-testid="home-form" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 0.5 }}>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          Forma: <Box component="span" sx={{ color: surface[50], fontWeight: 600 }}>{formaLabel ?? 'sem dados ainda'}</Box>
        </Typography>
        <Link component={RouterLink} to={ROUTES.ATHLETE_PROGRESS} variant="body2" underline="hover" sx={{ fontWeight: 600, py: 0.75 }}>
          Ver progresso →
        </Link>
      </Box>

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
