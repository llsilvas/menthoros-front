import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  Slider,
  Tab,
  Tabs,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  ContentCopy as ContentCopyIcon,
  FilterAlt as FilterAltIcon,
  MoreHoriz as MoreHorizIcon,
  NotificationsNone as NotificationsNoneIcon,
  Search as SearchIcon,
  SwapHoriz as SwapHorizIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { CurrentWeekPlan } from '../components/CurrentWeekPlan';
import { DashboardAttentionQueueRow } from '../components/DashboardAttentionQueueRow';
import { DashboardCalendarPanel } from '../components/DashboardCalendarPanel';
import { DashboardInsightsPanel } from '../components/DashboardInsightsPanel';
import { DashboardRosterPreviewRow } from '../components/DashboardRosterPreviewRow';
import { DetailMetric } from '../components/DetailMetric';
import { MetricTile } from '../components/MetricTile';
import { QueueRow } from '../components/QueueRow';
import { RecentSuggestionsPanel } from '../components/RecentSuggestionsPanel';
import { SectionCard } from '../components/SectionCard';
import { TrendCard } from '../components/TrendCard';
import {
  formatKm,
  formatPercent,
  formatWorkoutTypeLabel,
  paletteForDecision,
  statusLabel,
} from '../components/coachInboxHelpers';
import { useCoachDashboard } from '../../../hooks/useCoachDashboard';
import { useAthleteProfile } from '../../../hooks/useAthleteProfile';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { usePlanDraft } from '../hooks/usePlanDraft';
import { usePlanReview } from '../hooks/usePlanReview';
import { ROSTER_PAGE_SIZE } from '../hooks/useDashboardFilters';
import type { SortKey, DashboardStatusFilter } from '../hooks/useDashboardFilters';
import { elevation } from '../../../shared/design-tokens';
import { content, primary, semantic, surface } from '../../../theme/tokens';
import type { CoachAtletaResumo, CoachAtletaStatus } from '../../../types/Coach';
import type { AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';
import type { Prova } from '../../../types/Prova';
import type {
  CoachAthleteRow,
  RaceItem,
  SegmentFilter,
} from '../types/CoachInbox';

type TabKey = 'review' | 'plan' | 'calendar' | 'status' | 'adherence';


const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'priority', label: 'Prioridade' },
  { key: 'adherence', label: 'Aderência' },
  { key: 'load', label: 'Carga' },
  { key: 'race', label: 'Próxima prova' },
];
const DASHBOARD_STATUS_OPTIONS: Array<{ key: DashboardStatusFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativo' },
  { key: 'warning', label: 'Atenção' },
  { key: 'danger', label: 'Alerta' },
  { key: 'paused', label: 'Pausado' },
];



function formatRaceDate(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(`${dateIso}T12:00:00`))
    .replace('.', '');
}

function buildRaceCalendarFromProfile(profile: AtletaPerfilCoachDto | null): RaceItem[] {
  const provas = profile?.provas?.length ? profile.provas : profile?.proximaProva ? [profile.proximaProva] : [];

  return [...provas]
    .filter((prova): prova is Prova => Boolean(prova?.dataProva))
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva))
    .map((prova) => ({
      date: formatRaceDate(prova.dataProva),
      label: prova.nomeProva,
      tag: prova.provaAlvo ? 'ALVO' : 'PRINCIPAL',
    }));
}


const TABS: Array<{ key: TabKey; label: string; icon: ReactElement }> = [
  { key: 'review', label: 'Revisão do treino', icon: <CheckCircleIcon fontSize="small" /> },
  { key: 'plan', label: 'Ajustes de plano', icon: <TuneIcon fontSize="small" /> },
  { key: 'calendar', label: 'Calendário de provas', icon: <CalendarMonthIcon fontSize="small" /> },
  { key: 'status', label: 'Status do treinamento', icon: <NotificationsNoneIcon fontSize="small" /> },
  { key: 'adherence', label: 'Adesão', icon: <FilterAltIcon fontSize="small" /> },
];


function statusToSegment(status: CoachAtletaStatus): SegmentFilter {
  if (status === 'warning') return 'attention';
  if (status === 'danger') return 'drop';
  if (status === 'paused') return 'stable';
  return 'stable';
}


function buildSelectedAthleteFromDashboard(roster: CoachAtletaResumo, profile: AtletaPerfilCoachDto | null): CoachAthleteRow {
  const pmcPoints = profile?.pmc ?? [];
  const adherencePoints = profile?.aderenciaSemanal ?? [];
  const firstWorkout = profile?.planoVigente?.treinos[0] ?? null;
  const latestPmc = pmcPoints[pmcPoints.length - 1] ?? null;
  const latestAdherence = adherencePoints[adherencePoints.length - 1] ?? null;

  return {
    id: roster.atletaId,
    name: profile?.nomeAtleta ?? roster.nome,
    discipline: profile?.objetivo ?? roster.fase ?? 'Corrida',
    age: 0,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: profile?.planoVigente?.reviewStatus === 'AGUARDANDO_REVISAO' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: latestAdherence?.percentual ?? 0,
    load7d: roster.weeklyVolume,
    loadDelta: 0,
    delay: 0,
    nextWorkout: {
      title: firstWorkout ? formatWorkoutTypeLabel(firstWorkout.tipoTreino) : 'Sem treino planejado',
      when: firstWorkout ? firstWorkout.diaSemana : 'Sem data',
      zone: firstWorkout?.zonaAlvo ?? '—',
      duration: firstWorkout?.duracaoMin ?? '—',
      objective: firstWorkout ? 'Treino vindo do backend.' : 'Nenhum treino planejado no plano vigente.',
    },
    lastWorkouts: [],
    raceCalendar: buildRaceCalendarFromProfile(profile),
    loadTrend: pmcPoints.map((point) => point.ctl).length > 0 ? pmcPoints.map((point) => point.ctl) : [roster.weeklyVolume],
    adherenceTrend: adherencePoints.map((point) => point.percentual),
    notes: profile?.avisos?.length ? profile.avisos.join(' · ') : 'Sem observações adicionais.',
    suggestedActions: profile?.sinaisRecentes.length
      ? profile.sinaisRecentes.map((signal) => signal.acaoSugerida).slice(0, 3)
      : ['Abrir o perfil do atleta para detalhes completos'],
    quickStats: {
      acuteLoad: latestPmc?.ctl ?? roster.weeklyVolume,
      monotony: 1,
      fatigue: latestPmc && latestPmc.tsb < -10 ? 'Alta' : latestPmc && latestPmc.tsb < 0 ? 'Média' : 'Baixa',
      recovery: latestAdherence?.percentual ?? 0,
    },
  };
}

function buildRosterRowFromSummary(roster: CoachAtletaResumo): CoachAthleteRow {
  return {
    id: roster.atletaId,
    name: roster.nome,
    discipline: roster.fase ?? 'Corrida',
    age: 0,
    gender: '',
    weeksOnPlan: 0,
    segment: statusToSegment(roster.status),
    planStatus: roster.status === 'paused' ? 'ATRASADO' : 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: statusLabel(roster.status),
    decision: 'PENDING',
    adherence: 0,
    load7d: roster.weeklyVolume,
    loadDelta: 0,
    delay: 0,
    nextWorkout: {
      title: 'Resumo do dashboard',
      when: '—',
      zone: '—',
      duration: '—',
      objective: 'Abra o atleta para ver o detalhe completo.',
    },
    lastWorkouts: [],
    raceCalendar: [],
    loadTrend: [roster.weeklyVolume],
    adherenceTrend: [],
    notes: 'Resumo agregado carregado do dashboard.',
    suggestedActions: ['Abrir o perfil do atleta'],
    quickStats: {
      acuteLoad: roster.weeklyVolume,
      monotony: 1,
      fatigue: roster.status === 'danger' ? 'Alta' : roster.status === 'warning' ? 'Média' : 'Baixa',
      recovery: 0,
    },
  };
}











function CoachInboxPage() {
  const navigate = useNavigate();
  const { reviewAprovar, reviewRejeitar, reviewFetchPendentes } = useOutletContext<CoachLayoutOutletContext>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('review');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const {
    dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    fetchDashboard,
  } = useCoachDashboard();
  const dashboardRoster = dashboard?.roster.items ?? [];
  const { profile: selectedProfile, fetchProfile: fetchSelectedProfile } = useAthleteProfile(selectedId ?? dashboardRoster[0]?.atletaId);

  const dashboardAttentionQueue = dashboard?.attentionQueue ?? [];
  const dashboardCalendar = dashboard?.calendar ?? null;
  const dashboardInsights = dashboard?.insights ?? null;
  const rosterItems = dashboardRoster;
  const dashboardRosterPage = dashboard?.roster ?? null;
  const rosterTotal = dashboardRosterPage?.totalElements ?? 0;
  const rosterPageCount = dashboardRosterPage?.totalPages ?? 0;
  const selectedRosterItem = useMemo(
    () => rosterItems.find((athlete) => athlete.atletaId === selectedId) ?? rosterItems[0] ?? null,
    [rosterItems, selectedId],
  );
  const selected = useMemo(() => {
    if (!selectedRosterItem) return null;
    return buildSelectedAthleteFromDashboard(selectedRosterItem, selectedProfile);
  }, [selectedProfile, selectedRosterItem]);
  const {
    search,
    dashboardPage,
    setDashboardPage,
    dashboardStatus,
    sortBy,
    currentSortLabel,
    reloadDashboard,
    handleSearchChange,
    handleDashboardStatusChange,
    handleSortChange,
    handleRosterPageChange,
    resetFilters,
  } = useDashboardFilters({ fetchDashboard });

  const { draftIntensity, setDraftIntensity, draftDistance, setDraftDistance, draftDuration, setDraftDuration } = usePlanDraft(selected);

  const nextRace = selected?.raceCalendar[0] ?? null;
  const isTargetRace = nextRace?.tag === 'ALVO';

  useEffect(() => {
    if (rosterItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !rosterItems.some((athlete) => athlete.atletaId === selectedId)) {
      setSelectedId(rosterItems[0].atletaId);
    }
  }, [rosterItems, selectedId]);

  useEffect(() => {
    const maxPage = Math.max(0, rosterPageCount - 1);
    if (dashboardPage > maxPage) {
      setDashboardPage(maxPage);
    }
  }, [dashboardPage, rosterPageCount, setDashboardPage]);

  const dashboardSummary = dashboard?.summary ?? null;
  const summary = {
    totalAtletas: dashboardSummary?.kpis.totalAtletas ?? 0,
    ativos: dashboardSummary?.kpis.ativos ?? 0,
    emAtencao: dashboardSummary?.kpis.emAtencao ?? 0,
    treinosPlanejadosSemana: dashboardSummary?.kpis.treinosPlanejadosSemana ?? 0,
    atletasExibidos: dashboardSummary?.atletasExibidos ?? rosterTotal,
    itensFilaAtencao: dashboardSummary?.itensFilaAtencao ?? 0,
  };
  const dashboardUpdatedAt = dashboard?.generatedAt
    ? new Date(dashboard.generatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  const selectedPalette = selected ? paletteForDecision(selected.decision) : paletteForDecision('PENDING');
  const rosterHeaderLabel = rosterTotal > 0 ? `${dashboardPage + 1}/${rosterPageCount}` : '0/0';
  const selectedPlanId = selectedProfile?.planoVigente?.planoId ?? null;
  const selectedReviewStatus = selectedProfile?.planoVigente?.reviewStatus ?? null;

  const {
    rejectDialogOpen,
    rejectReason,
    setRejectReason,
    handleApprovePlan,
    openRejectDialog: openRejectDialogBase,
    closeRejectDialog,
    handleRejectPlan,
  } = usePlanReview({
    selectedPlanId,
    reviewAprovar,
    reviewRejeitar,
    reviewFetchPendentes,
    reloadDashboard,
    fetchSelectedProfile,
  });

  const openRejectDialog = useCallback(() => {
    setMenuAnchor(null);
    openRejectDialogBase();
  }, [openRejectDialogBase]);

  const saveAdjustment = useCallback(() => {
    setFeedback('Ajustes rápidos ainda não persistem no backend. Use a revisão do plano.');
    setActiveTab('review');
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: elevation.base }}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: `1px solid ${content.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
          <Typography sx={{ fontSize: '0.82rem', color: primary[500], fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Assistente do Treinador
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' }, fontWeight: 800, color: surface[50], lineHeight: 1.05, fontFamily: 'Syne, sans-serif' }}>
            Fila, plano e calendário
          </Typography>
          <Typography sx={{ fontSize: '0.86rem', color: surface[400], mt: 0.3 }}>
            Revisão rápida, ajuste de plano e leitura de prova, status e adesão.
          </Typography>
        </Box>

        <TextField
          size="small"
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar atleta, treino ou prova..."
          sx={{ minWidth: { xs: '100%', md: 320 }, flex: '0 1 360px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" sx={{ border: `1px solid ${content.cardBorder}`, bgcolor: `${surface[0]}08` }}>
            <NotificationsNoneIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ border: `1px solid ${content.cardBorder}`, bgcolor: `${surface[0]}08` }}>
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ExpandMoreIcon />}
            sx={{ textTransform: 'none', borderColor: content.cardBorder, color: surface[200], minWidth: 160 }}
          >
            Lucas Ferreira
          </Button>
        </Box> */}
      </Box>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: `1px solid ${content.divider}`,
          backgroundColor: `${surface[0]}04`,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px 220px auto' },
            gap: 1,
            alignItems: 'end',
          }}
        >
          <FormControl size="small" fullWidth>
            <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
              Status
            </Typography>
            <Select
              value={dashboardStatus}
              onChange={handleDashboardStatusChange}
              sx={{
                fontSize: '0.8rem',
                color: surface[200],
                '& .MuiOutlinedInput-notchedOutline': { borderColor: content.cardBorder },
              }}
            >
              {DASHBOARD_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
              Ordenar
            </Typography>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              sx={{
                fontSize: '0.8rem',
                color: surface[200],
                '& .MuiOutlinedInput-notchedOutline': { borderColor: content.cardBorder },
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: surface[400], minWidth: 0, px: 1 }}>
              Limpar filtros
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(240px, 280px) minmax(260px, 300px) minmax(0, 1fr)',
            xl: 'minmax(280px, 340px) minmax(310px, 380px) minmax(0, 1fr)',
          },
          '@media (min-width: 1800px)': {
            gridTemplateColumns: 'minmax(320px, 400px) minmax(360px, 440px) minmax(0, 1fr)',
          },
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        <Box
          sx={{
            minHeight: 0,
            minWidth: 0,
            borderRight: { lg: `1px solid ${content.divider}` },
            overflow: 'auto',
            p: { xs: 1.25, lg: 1.1 },
          }}
        >
          <Box
            sx={{
              mt: 0,
              p: { xs: 1.1, lg: 0.95 },
              borderRadius: 2,
              border: `1px solid ${content.cardBorder}`,
              backgroundColor: `${surface[0]}05`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '0.7rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Resumo rápido
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: surface[500], textAlign: 'right' }}>
                {dashboardLoading
                  ? 'Atualizando dashboard agregado...'
                  : dashboardUpdatedAt
                    ? `Atualizado em ${dashboardUpdatedAt}`
                    : 'Resumo local temporário'}
              </Typography>
            </Box>
            {dashboardError ? (
              <Alert
                severity="warning"
                sx={{
                  mb: 1.5,
                  bgcolor: `${semantic.warning[500]}10`,
                  border: `1px solid ${semantic.warning[500]}33`,
                  color: surface[50],
                  '& .MuiAlert-icon': { color: semantic.warning[500] },
                }}
              >
                Não foi possível carregar o dashboard agregado. Mantendo a tela funcional com os dados locais.
              </Alert>
            ) : null}
            {dashboardLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.9, mt: 1.1 }}>
              <MetricTile compact label="Atletas ativos" value={String(summary.ativos)} delta={`${summary.totalAtletas} no total`} tone="success" />
              <MetricTile compact label="Treinos planejados" value={String(summary.treinosPlanejadosSemana)} delta="na semana" />
              <MetricTile compact label="Em atenção" value={String(summary.emAtencao)} delta={`${summary.itensFilaAtencao} na fila`} tone="warning" />
              <MetricTile compact label="Atletas exibidos" value={String(summary.atletasExibidos)} />
            </Box>
            {dashboardAttentionQueue.length > 0 ? (
              <Box sx={{ mt: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Fila de atenção
                  </Typography>
                  <Button size="small" sx={{ textTransform: 'none', color: surface[400] }} onClick={() => navigate('/coach/insights')}>
                    Ver insights
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                  {dashboardAttentionQueue.slice(0, 3).map((item) => (
                    <DashboardAttentionQueueRow key={item.atletaId} item={item} />
                  ))}
                </Box>
              </Box>
            ) : null}
            {dashboardRoster.length > 0 ? (
              <Box sx={{ mt: 1.25 }}>
                <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Roster do dashboard
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                  {dashboardRoster.slice(0, 3).map((athlete) => (
                    <DashboardRosterPreviewRow key={athlete.atletaId} athlete={athlete} />
                  ))}
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            borderRight: { lg: `1px solid ${surface[0]}22` },
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              minHeight: { lg: 82, xl: 90 },
              boxSizing: 'border-box',
              borderBottom: `1px solid ${content.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.78rem', color: surface[400], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Fila de revisão
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: surface[500] }}>
                {rosterItems.length} atleta{rosterItems.length !== 1 ? 's' : ''} · página {rosterHeaderLabel}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={currentSortLabel}
              sx={{ bgcolor: `${primary[500]}14`, color: primary[500], border: `1px solid ${primary[500]}44`, fontWeight: 700 }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {rosterItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: surface[400] }}>Nenhum atleta carregado do dashboard.</Typography>
              </Box>
            ) : (
              rosterItems.map((athlete) => (
                <QueueRow
                  key={athlete.atletaId}
                  athlete={buildRosterRowFromSummary(athlete)}
                  selected={athlete.atletaId === selectedId}
                  onClick={() => setSelectedId(athlete.atletaId)}
                />
              ))
            )}
          </Box>
          <Box
            sx={{
              borderTop: `1px solid ${content.divider}`,
              backgroundColor: `${surface[0]}08`,
            }}
          >
            <TablePagination
              component="div"
              count={rosterTotal}
              page={dashboardPage}
              onPageChange={handleRosterPageChange}
              rowsPerPage={ROSTER_PAGE_SIZE}
              rowsPerPageOptions={[ROSTER_PAGE_SIZE]}
              onRowsPerPageChange={() => setDashboardPage(0)}
              labelRowsPerPage="Itens por página"
              sx={{
                color: surface[300],
                '& .MuiTablePagination-toolbar': { minHeight: 52, px: 1 },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.8rem',
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selected ? (
            <>
              <Box
                sx={{
                  px: { xs: 1.15, sm: 1.3, lg: 1.5, xl: 2 },
                  py: { xs: 0.95, sm: 1.05, lg: 1.2, xl: 1.65 },
                  minHeight: { lg: 82, xl: 90 },
                  boxSizing: 'border-box',
                  borderBottom: `1px solid ${content.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 1.15, lg: 1.4, xl: 2 },
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 0.9, lg: 1.05, xl: 1.35 }, minWidth: 0 }}>
                  <CoachAthleteAvatar athlete={{ id: selected.id, name: selected.name }} size="md" status={selected.segment === 'drop' ? 'alert' : selected.segment === 'attention' ? 'warning' : 'synced'} />
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: { xs: '1.06rem', sm: '1.16rem', lg: '1.3rem', xl: '1.55rem' }, fontWeight: 800, color: surface[50], lineHeight: 1.05, fontFamily: 'Syne, sans-serif' }}>
                        {selected.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={selected.statusLabel}
                        sx={{
                          fontSize: { xs: '0.58rem', sm: '0.62rem', lg: '0.64rem', xl: '0.68rem' },
                          fontWeight: 700,
                          color: selectedPalette.fg,
                          bgcolor: selectedPalette.bg,
                          border: `1px solid ${selectedPalette.border}`,
                        }}
                      />
                    </Box>
                    <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.86rem', color: surface[400], mt: 0.2 }}>
                      {selected.discipline} · {selected.age} anos · {selected.gender} · {selected.weeksOnPlan} semanas
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.15, lg: 1.45, xl: 2 }, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '0.56rem', sm: '0.6rem', lg: '0.63rem', xl: '0.68rem' }, color: surface[500], textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aderência geral</Typography>
                    <Typography sx={{ fontSize: { xs: '1.08rem', sm: '1.18rem', lg: '1.28rem', xl: '1.5rem' }, fontWeight: 800, color: selected.adherence >= 85 ? semantic.success[500] : selected.adherence >= 70 ? primary[500] : semantic.warning[500] }}>
                      {formatPercent(selected.adherence)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '0.56rem', sm: '0.6rem', lg: '0.63rem', xl: '0.68rem' }, color: surface[500], textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carga semanal</Typography>
                    <Typography sx={{ fontSize: { xs: '1.08rem', sm: '1.18rem', lg: '1.28rem', xl: '1.5rem' }, fontWeight: 800, color: surface[50] }}>
                      {formatKm(selected.load7d)}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: selected.loadDelta >= 0 ? semantic.success[500] : semantic.danger[500] }}>
                      {selected.loadDelta >= 0 ? '+' : ''}
                      {selected.loadDelta}% vs. ant.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  px: { xs: 1.1, sm: 1.2, lg: 1.3, xl: 2 },
                  py: { xs: 0.65, sm: 0.75, lg: 0.85, xl: 1.25 },
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
                  gap: { xs: 0.55, sm: 0.65, lg: 0.75, xl: 1.2 },
                  borderBottom: `1px solid ${content.divider}`,
                }}
              >
                <MetricTile compact label="Aderência" value={formatPercent(selected.adherence)} delta="Últimas 6 semanas" tone={selected.adherence >= 85 ? 'success' : selected.adherence >= 70 ? 'neutral' : 'warning'} />
                <MetricTile compact label="Carga (7d)" value={formatKm(selected.load7d)} delta={`${selected.loadDelta >= 0 ? '+' : ''}${selected.loadDelta}% vs. ant.`} tone={selected.loadDelta >= 10 ? 'warning' : 'success'} />
                <MetricTile compact label="Fadiga" value={selected.quickStats.fatigue} delta={`Monotonia ${selected.quickStats.monotony.toFixed(2)}`} tone={selected.quickStats.fatigue === 'Alta' ? 'danger' : selected.quickStats.fatigue === 'Média' ? 'warning' : 'success'} />
                <MetricTile compact label={isTargetRace ? 'Prova Alvo' : 'Próxima Prova'} delta={selected.raceCalendar[0]?.date ?? '—'} value={selected.raceCalendar[0]?.label ?? 'Sem prova próxima'} tone={isTargetRace ? 'warning' : 'neutral'} highlight={isTargetRace} />
              </Box>

              <Box sx={{ px: { xs: 1.1, sm: 1.2, lg: 1.3, xl: 2 }, pt: { xs: 0.35, sm: 0.45, lg: 0.5, xl: 0.8 }, borderBottom: `1px solid ${content.divider}` }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value as TabKey)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: { xs: 34, xl: 42 },
                    '& .MuiTab-root': {
                      minHeight: { xs: 34, xl: 42 },
                      px: { xs: 1, xl: 1.5 },
                      textTransform: 'none',
                      fontSize: { xs: '0.72rem', xl: '0.82rem' },
                      fontWeight: 600,
                      color: surface[400],
                      '& .MuiSvgIcon-root': { fontSize: { xs: 16, xl: 20 } },
                    },
                    '& .Mui-selected': { color: primary[500] },
                    '& .MuiTabs-indicator': { backgroundColor: primary[500] },
                  }}
                >
                  {TABS.map((tab) => (
                    <Tab key={tab.key} value={tab.key} icon={tab.icon} iconPosition="start" label={tab.label} />
                  ))}
                </Tabs>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: 0.9, sm: 1, lg: 1.15, xl: 2.25 } }}>
                {feedback ? (
                  <Alert
                    severity="success"
                    sx={{ mb: 1, bgcolor: `${semantic.success[500]}10`, border: `1px solid ${semantic.success[500]}33`, color: surface[50] }}
                    onClose={() => setFeedback(null)}
                  >
                    {feedback}
                  </Alert>
                ) : null}

                {activeTab === 'review' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.08fr 0.92fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 1.35 } }}>
                    <SectionCard
                      title="Próximo treino"
                      action={
                        <Button
                          size="small"
                          endIcon={<ArrowForwardIcon fontSize="small" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                            px: { xs: 0.75, xl: 1 },
                            '& .MuiButton-endIcon': { display: { xs: 'none', xl: 'inherit' } },
                          }}
                          onClick={() => navigate('/coach/calendar')}
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
                              {selected.nextWorkout.when} · {selected.nextWorkout.zone} · {selected.nextWorkout.duration}
                            </Typography>
                          </Box>
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

                        <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.9rem', color: surface[100], lineHeight: 1.45 }}>
                          {selected.nextWorkout.objective}
                        </Typography>

                        <Typography sx={{ display: { xs: 'none', xl: 'block' }, fontSize: '0.78rem', color: surface[400] }}>
                          Estrutura sugerida: {selected.nextWorkout.title} em {selected.nextWorkout.zone} com atenção ao frescor.
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.6, xl: 1 } }}>
                          <Button
                            variant="contained"
                            onClick={() => setFeedback('Treino marcado como concluído localmente.')}
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
                            onClick={() => setActiveTab('plan')}
                            sx={{ textTransform: 'none', fontSize: { xs: '0.72rem', xl: '0.8125rem' }, px: { xs: 1, xl: 1.5 } }}
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
                          onVerTodas={() => navigate('/coach/inbox')}
                        />
                      </SectionCard>
                    </Box>
                  </Box>
                ) : null}

                {activeTab === 'plan' ? (
                  selectedProfile?.planoVigente ? (
                    <SectionCard
                      title="Plano real do atleta"
                      action={
                        <Button size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/coach/planos/revisao')}>
                          Abrir revisão
                        </Button>
                      }
                    >
                      <CurrentWeekPlan
                        plano={selectedProfile.planoVigente}
                        onGerarPlano={() => navigate('/coach/planos/revisao')}
                        onRevisarPlano={() => navigate('/coach/planos/revisao')}
                        onTreinoEditado={() => {
                          reloadDashboard();
                          void fetchSelectedProfile();
                        }}
                      />
                    </SectionCard>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
                      <SectionCard title="Ajuste rápido">
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.85, sm: 0.95, lg: 1.05, xl: 2 } }}>
                          <Box>
                            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Intensidade</Typography>
                            <FormControl fullWidth size="small">
                              <Select value={draftIntensity} onChange={(event) => setDraftIntensity(event.target.value)}>
                                <MenuItem value="Geral">Geral</MenuItem>
                                <MenuItem value="Z1">Z1</MenuItem>
                                <MenuItem value="Z2">Z2</MenuItem>
                                <MenuItem value="Z3">Z3</MenuItem>
                                <MenuItem value="Z4">Z4</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          <Box>
                            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Distância</Typography>
                            <Slider
                              value={draftDistance}
                              onChange={(_, value) => {
                                if (!Array.isArray(value)) setDraftDistance(value);
                              }}
                              min={8}
                              max={34}
                              step={1}
                              valueLabelDisplay="auto"
                            />
                          </Box>

                          <Box>
                            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: surface[400], mb: 0.55 }}>Duração estimada</Typography>
                            <Slider
                              value={draftDuration}
                              onChange={(_, value) => {
                                if (!Array.isArray(value)) setDraftDuration(value);
                              }}
                              min={45}
                              max={220}
                              step={5}
                              valueLabelDisplay="auto"
                            />
                          </Box>

                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 0.65 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SwapHorizIcon />}
                              sx={{
                                textTransform: 'none',
                                fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                                px: { xs: 0.75, xl: 1.25 },
                                '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
                              }}
                            >
                              Mover
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopyIcon />}
                              sx={{
                                textTransform: 'none',
                                fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                                px: { xs: 0.75, xl: 1.25 },
                                '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
                              }}
                            >
                              Duplicar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<TuneIcon />}
                              sx={{
                                textTransform: 'none',
                                fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                                px: { xs: 0.75, xl: 1.25 },
                                '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
                              }}
                            >
                              Substituir
                            </Button>
                          </Box>

                          <Button
                            size="small"
                            variant="contained"
                            onClick={saveAdjustment}
                            sx={{
                              textTransform: 'none',
                              fontSize: { xs: '0.74rem', xl: '0.8125rem' },
                              bgcolor: primary[500],
                              color: surface[900],
                              '&:hover': { bgcolor: primary[400] },
                            }}
                          >
                            Salvar alterações
                          </Button>
                        </Box>
                      </SectionCard>

                      <SectionCard title="Impacto da alteração">
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
                          <DetailMetric label="Carga semanal" value={`${draftDistance * 4} km`} subtitle={`Impacto estimado para ${draftIntensity}`} tone="success" />
                          <DetailMetric label="Fadiga projetada" value={draftDistance > 28 ? 'Alta' : draftIntensity === 'Z4' ? 'Média' : 'Baixa'} subtitle="Estimativa visual do ajuste" tone={draftDistance > 28 ? 'warning' : 'neutral'} />
                          <DetailMetric label="Recuperação" value={draftDuration > 150 ? '72%' : '84%'} subtitle="Baseado na duração do bloco" tone={draftDuration > 150 ? 'warning' : 'success'} />
                          <TrendCard data={selected.loadTrend.map((value, index) => value + (index === selected.loadTrend.length - 1 ? Math.max(-6, Math.min(10, draftDistance - 28)) * 2 : 0))} />
                        </Box>
                      </SectionCard>
                    </Box>
                  )
                ) : null}

                {activeTab === 'calendar' ? (
                  dashboardCalendar ? (
                    <DashboardCalendarPanel calendario={dashboardCalendar} onOpenCalendar={() => navigate('/coach/calendar')} />
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 0.95fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
                      <SectionCard title="Calendário de provas" action={<Button size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/coach/calendar')}>Ver calendário completo</Button>}>
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
                  )
                ) : null}

                {activeTab === 'status' ? (
                  dashboardInsights ? (
                    <DashboardInsightsPanel insights={dashboardInsights} onOpenInsights={() => navigate('/coach/insights')} />
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 0.9, sm: 1.05, lg: 1.25, xl: 1.5 } }}>
                      <DetailMetric label="Carga aguda" value={formatKm(selected.quickStats.acuteLoad)} subtitle="Ideal: 110-150 km" tone={selected.quickStats.acuteLoad > 120 ? 'warning' : 'success'} />
                      <DetailMetric label="Monotonia" value={selected.quickStats.monotony.toFixed(2)} subtitle="Ideal: < 2.0" tone={selected.quickStats.monotony > 1.4 ? 'warning' : 'success'} />
                      <DetailMetric label="Fadiga" value={selected.quickStats.fatigue} subtitle="Sinais moderados" tone={selected.quickStats.fatigue === 'Alta' ? 'warning' : 'success'} />
                      <DetailMetric label="Recuperação" value={formatPercent(selected.quickStats.recovery)} subtitle="Boa" tone={selected.quickStats.recovery < 80 ? 'warning' : 'success'} />
                      <Box
                        sx={{
                          gridColumn: { xs: '1 / -1', md: '1 / -1' },
                          border: `1px solid ${content.cardBorder}`,
                          borderRadius: 2,
                          backgroundColor: elevation.card,
                          p: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: surface[400], fontWeight: 700 }}>
                            Tendência de carga
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: semantic.success[500], fontWeight: 700 }}>+8% vs semana anterior</Typography>
                        </Box>
                        <TrendCard data={selected.loadTrend} />
                      </Box>
                    </Box>
                  )
                ) : null}

                {activeTab === 'adherence' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 0.95fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
                    <SectionCard title="Adesão nas últimas semanas">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.2 } }}>
                        {selected.adherenceTrend.map((value, index) => (
                          <Box key={`${selected.id}-adherence-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Typography sx={{ width: 40, fontSize: '0.64rem', color: surface[400] }}>S{index + 1}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={value}
                              sx={{
                                flex: 1,
                                height: 5,
                                borderRadius: 999,
                                bgcolor: `${surface[0]}14`,
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: value >= 85 ? semantic.success[500] : value >= 70 ? primary[500] : semantic.warning[500],
                                  borderRadius: 999,
                                },
                              }}
                            />
                            <Typography sx={{ width: 36, textAlign: 'right', fontSize: '0.64rem', color: surface[200], fontWeight: 700 }}>{value}%</Typography>
                          </Box>
                        ))}
                      </Box>
                    </SectionCard>

                    <SectionCard title="Notas do treinador">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 1, xl: 1.5 } }}>
                        <Typography sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem', lg: '0.85rem', xl: '0.9rem' }, color: surface[100], lineHeight: 1.45 }}>{selected.notes}</Typography>
                        <Divider sx={{ borderColor: content.divider }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {selected.suggestedActions.map((action) => (
                            <Box key={`${selected.id}-${action}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
                              <Typography sx={{ fontSize: '0.84rem', color: surface[200] }}>{action}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </SectionCard>
                  </Box>
                ) : null}
              </Box>

              <Box
                sx={{
                  px: { xs: 1.1, sm: 1.2, lg: 1.35, xl: 2.5 },
                  py: { xs: 0.85, sm: 0.95, lg: 1.05, xl: 1.8 },
                  borderTop: `1px solid ${content.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.6, lg: 0.75, xl: 1.2 },
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ChatBubbleOutlineIcon />}
                  onClick={() => setFeedback('Mensagem preparada para o atleta.')}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                    px: { xs: 0.85, xl: 1.5 },
                    '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
                  }}
                >
                  Enviar mensagem
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setActiveTab('plan')}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                    px: { xs: 0.85, xl: 1.5 },
                    '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
                  }}
                >
                  Ajustar plano
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleApprovePlan}
                  disabled={!selectedPlanId || selectedReviewStatus !== 'AGUARDANDO_REVISAO' || selected.decision !== 'PENDING'}
                  sx={{
                    bgcolor: semantic.success[500],
                    color: '#fff',
                    textTransform: 'none',
                    minWidth: { xs: 112, xl: 150 },
                    fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                    px: { xs: 1, xl: 1.5 },
                    '&:hover': { bgcolor: semantic.success[700] },
                    '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                  }}
                >
                  Aprovar plano
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  endIcon={<MoreHorizIcon />}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.72rem', xl: '0.8125rem' },
                    px: { xs: 0.85, xl: 1.5 },
                    '& .MuiButton-endIcon': { display: { xs: 'none', xl: 'inherit' } },
                  }}
                >
                  Mais ações
                </Button>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      setFeedback('Plano marcado como prioridade.');
                    }}
                  >
                    Marcar como prioridade
                  </MenuItem>
                  <MenuItem
                    onClick={openRejectDialog}
                    disabled={!selectedPlanId || selectedReviewStatus !== 'AGUARDANDO_REVISAO' || selected.decision !== 'PENDING'}
                  >
                    Rejeitar plano
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      setActiveTab('plan');
                    }}
                  >
                    Abrir editor do plano
                  </MenuItem>
                </Menu>
              </Box>
              <Dialog open={rejectDialogOpen} onClose={closeRejectDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Rejeitar plano</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                  <Typography sx={{ color: surface[400], fontSize: '0.9rem', mb: 2 }}>
                    Informe um motivo objetivo para a rejeição. Isso entra no histórico do plano.
                  </Typography>
                  <TextField
                    autoFocus
                    fullWidth
                    multiline
                    minRows={4}
                    label="Motivo"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                  />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                  <Button onClick={closeRejectDialog} sx={{ textTransform: 'none' }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => void handleRejectPlan(rejectReason)}
                    disabled={!rejectReason.trim()}
                    sx={{ textTransform: 'none' }}
                  >
                    Confirmar rejeição
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: surface[50] }}>Selecione um atleta para ver os detalhes</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: surface[400], mt: 0.8 }}>Os filtros ao lado mostram quem precisa de ação agora.</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default CoachInboxPage;
