import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarMonth as CalendarMonthIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  MoreHoriz as MoreHorizIcon,
  NotificationsNone as NotificationsNoneIcon,
  Search as SearchIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { DANGER_BTN_SX, GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { DashboardAttentionQueueRow } from '../components/DashboardAttentionQueueRow';
import { DashboardRosterPreviewRow } from '../components/DashboardRosterPreviewRow';
import { MetricTile } from '../components/MetricTile';
import { QueueRow } from '../components/QueueRow';
import { formatKm, formatPercent, paletteForDecision } from '../components/coachInboxHelpers';
import { ACTION_BTN_START_ICON_SX, ACTION_BTN_END_ICON_SX } from '../../../shared/components/actionButtonSx';
import { DiagnosisTabPanel } from '../components/panels/DiagnosisTabPanel';
import { PlanTabPanel } from '../components/panels/PlanTabPanel';
import { RacesSuggestionsTabPanel } from '../components/panels/RacesSuggestionsTabPanel';
import { useCoachDashboard } from '../../../hooks/useCoachDashboard';
import { useAthleteProfile } from '../../../hooks/useAthleteProfile';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { usePlanReview } from '../hooks/usePlanReview';
import { ROSTER_PAGE_SIZE } from '../hooks/useDashboardFilters';
import type { SortKey, DashboardStatusFilter } from '../hooks/useDashboardFilters';
import { elevation } from '../../../shared/design-tokens';
import { content, primary, semantic, surface } from '../../../theme/tokens';
import { buildRosterRowFromSummary, buildSelectedAthleteFromDashboard, getAcwrZone } from '../adapters/coachInboxAdapters';
import { formFromTSB, formVariantLabel, getTsbFormaTone } from '../types/AthleteForm';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

type TabKey = 'diagnosis' | 'plan' | 'races';


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

const TABS: Array<{ key: TabKey; label: string; icon: ReactElement }> = [
  { key: 'diagnosis', label: 'Diagnóstico', icon: <NotificationsNoneIcon fontSize="small" /> },
  { key: 'plan', label: 'Plano', icon: <TuneIcon fontSize="small" /> },
  { key: 'races', label: 'Provas & sugestões', icon: <CalendarMonthIcon fontSize="small" /> },
];

function CoachInboxPage() {
  const navigate = useNavigate();
  const { reviewAprovar, reviewRejeitar, reviewFetchPendentes } = useOutletContext<CoachLayoutOutletContext>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('diagnosis');
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

  const nextRace = selected?.raceCalendar[0] ?? null;
  const isTargetRace = nextRace?.tag === 'ALVO';

  const tsbForma = selected?.quickStats.tsb != null ? formFromTSB(selected.quickStats.tsb) : null;
  const acwrZone = getAcwrZone(selected?.quickStats.acwr ?? null);

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
                    {selected.nivelExperiencia ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.15 }}>
                        <Typography component="span" sx={{ fontSize: { xs: '0.60rem', sm: '0.68rem', lg: '0.76rem', xl: '0.8rem' }, color: surface[400] }}>
                          {selected.nivelExperiencia}
                        </Typography>
                        {selected.age > 0 ? (
                          <Chip
                            size="small"
                            label={`${selected.age} anos`}
                            sx={{ height: 18, fontSize: '0.6rem', bgcolor: `${surface[500]}20`, color: surface[200] }}
                          />
                        ) : null}
                      </Box>
                    ) : null}
                    <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.68rem', lg: '0.74rem', xl: '0.8rem' }, color: surface[400], mt: 0.2 }}>
                      {selected.discipline}
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
                  gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' },
                  gap: { xs: 0.55, sm: 0.65, lg: 0.75, xl: 1.2 },
                  borderBottom: `1px solid ${content.divider}`,
                }}
              >
                <MetricTile compact label="Aderência" value={formatPercent(selected.adherence)} delta="Últimas 4 semanas" tone={selected.adherence >= 85 ? 'success' : selected.adherence >= 70 ? 'neutral' : 'warning'} />
                <MetricTile compact label="Carga (7d)" value={formatKm(selected.load7d)} delta={`${selected.loadDelta >= 0 ? '+' : ''}${selected.loadDelta}% vs. ant.`} tone={selected.loadDelta >= 10 ? 'warning' : 'success'} />
                <MetricTile
                  compact
                  label="Forma"
                  value={tsbForma != null ? formVariantLabel[tsbForma] : '—'}
                  delta={selected.quickStats.tsb != null ? `TSB ${selected.quickStats.tsb}` : 'TSB não disponível'}
                  tone={tsbForma != null ? getTsbFormaTone(tsbForma) : 'neutral'}
                />
                <MetricTile
                  compact
                  label="ACWR"
                  value={selected.quickStats.acwr != null ? selected.quickStats.acwr.toFixed(2) : '—'}
                  delta={selected.quickStats.acwr != null ? acwrZone.label : 'Dado insuficiente'}
                  tone={acwrZone.tone}
                />
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

                {activeTab === 'diagnosis' ? (
                  <DiagnosisTabPanel
                    selected={selected}
                    limiareisInferidos={selectedProfile?.limiareisInferidos ?? null}
                    onOpenPlan={() => setActiveTab('plan')}
                  />
                ) : null}

                {activeTab === 'plan' ? (
                  <PlanTabPanel
                    selectedProfile={selectedProfile}
                    reloadDashboard={reloadDashboard}
                    fetchSelectedProfile={fetchSelectedProfile}
                    onOpenRevisao={() => navigate('/coach/planos/revisao')}
                  />
                ) : null}

                {activeTab === 'races' ? (
                  <RacesSuggestionsTabPanel
                    selected={selected}
                    selectedProfile={selectedProfile}
                    onOpenCalendar={() => navigate('/coach/calendar')}
                    onOpenSuggestions={() => navigate('/coach/sugestoes')}
                  />
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
                  sx={ACTION_BTN_START_ICON_SX}
                >
                  Enviar mensagem
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setActiveTab('plan')}
                  sx={ACTION_BTN_START_ICON_SX}
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
                  sx={ACTION_BTN_END_ICON_SX}
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
              <CoachDialog
                open={rejectDialogOpen}
                onClose={closeRejectDialog}
                maxWidth="sm"
                title="Rejeitar plano"
                actions={
                  <>
                    <Button onClick={closeRejectDialog} sx={GHOST_BTN_SX}>
                      Cancelar
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => void handleRejectPlan(rejectReason)}
                      disabled={!rejectReason.trim()}
                      sx={DANGER_BTN_SX}
                    >
                      Confirmar rejeição
                    </Button>
                  </>
                }
              >
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
              </CoachDialog>
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
