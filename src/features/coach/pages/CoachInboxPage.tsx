import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
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
import { MetricTile } from '../components/MetricTile';
import { QueueRow } from '../components/QueueRow';
import { AttentionOnlyRow } from '../components/AttentionOnlyRow';
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
import { content, semantic, surface } from '../../../theme/tokens';
import { buildInboxQueue, buildSelectedAthleteFromDashboard, getAcwrZone } from '../adapters/coachInboxAdapters';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import { montarRascunhoContato, resolveActionAvailability, resolvePrimaryAction } from '../components/coachInboxHelpers';
import { PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { buildPmcDataPoints } from '../../athlete/adapters/pmcAdapter';
import { FAIXA_APRESENTACAO } from '../../../types/FaixaTsb';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';
import type { CoachAtletaResumo } from '../../../types/Coach';
import { ROUTES } from '../../../constants/routes';

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
  const {
    reviewAprovar, reviewRejeitar, reviewFetchPendentes,
    // O inbox não consumia estes dois: sem eles, o CTA não sabia que havia mutação em voo nem por
    // que a última ação falhou.
    reviewIsActing, reviewActionStatus,
  } = useOutletContext<CoachLayoutOutletContext>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Rascunho de contato exibido quando a área de transferência não está disponível. */
  const [rascunhoContato, setRascunhoContato] = useState<string | null>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
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
  const {
    profile: selectedProfile,
    isLoading: profileLoading,
    error: profileError,
    fetchProfile: fetchSelectedProfile,
  } = useAthleteProfile(selectedId ?? dashboardRoster[0]?.atletaId);

  // `?? []` cria um array novo a cada render, o que anularia os memos que dependem dele.
  const dashboardAttentionQueue = useMemo(() => dashboard?.attentionQueue ?? [], [dashboard?.attentionQueue]);
  const rosterItems = dashboardRoster;
  const dashboardRosterPage = dashboard?.roster ?? null;
  const rosterTotal = dashboardRosterPage?.totalElements ?? 0;
  const rosterPageCount = dashboardRosterPage?.totalPages ?? 0;
  const selectedRosterItem = useMemo(() => {
    const noRoster = rosterItems.find((athlete) => athlete.atletaId === selectedId);
    if (noRoster) return noRoster;

    // Atleta fixado pela fila de atenção: não está na página do roster, então não há resumo. O
    // painel é montado a partir do perfil real (`useAthleteProfile` busca por `selectedId`), que é
    // a fonte de tudo que ele exibe; este objeto só carrega identidade e severidade.
    const emAtencao = dashboardAttentionQueue.find((item) => item.atletaId === selectedId);
    if (emAtencao) {
      return {
        atletaId: emAtencao.atletaId,
        nome: emAtencao.athleteName,
        status: emAtencao.severity === 'MEDIA' ? 'warning' : 'danger',
        weeklyVolume: 0,
      } satisfies CoachAtletaResumo;
    }

    return rosterItems[0] ?? null;
  }, [dashboardAttentionQueue, rosterItems, selectedId]);
  const selected = useMemo(() => {
    if (!selectedRosterItem) return null;
    return buildSelectedAthleteFromDashboard(selectedRosterItem, selectedProfile);
  }, [selectedProfile, selectedRosterItem]);
  // Série PMC (CTL/ATL/TSB) do atleta selecionado — já vem no perfil agregado, sem fetch extra.
  const selectedPmc = useMemo(() => buildPmcDataPoints(selectedProfile?.pmc ?? []), [selectedProfile?.pmc]);
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

  /**
   * Lista principal = roster da página + atletas em atenção fixados no topo.
   *
   * O roster é paginado em 10 e a fila de atenção não; sem fixar, um atleta em alerta na página 2
   * some da tela — que existe justamente para mostrar quem precisa de atenção. Ver
   * `buildInboxQueue`, cujos testes cobrem paginação, filtro e deduplicação.
   */
  const inboxQueue = useMemo(
    () => buildInboxQueue(
      dashboardRosterPage ?? { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 },
      dashboardAttentionQueue,
      { status: dashboardStatus, search },
    ),
    [dashboardAttentionQueue, dashboardRosterPage, dashboardStatus, search],
  );

  /**
   * Estado da coluna da lista. Derivado, não inferido no JSX: "sem linhas" tem quatro causas com
   * saídas diferentes, e um `length === 0` no meio da renderização colapsava todas numa só.
   */
  const estadoDaLista: 'carregando' | 'erro' | 'vazio-filtrado' | 'vazio' | 'conteudo' = (() => {
    if (inboxQueue.rows.length > 0) return 'conteudo';
    if (dashboardLoading) return 'carregando';
    if (dashboardError) return 'erro';
    return dashboardStatus !== 'all' || search.trim() ? 'vazio-filtrado' : 'vazio';
  })();

  const nextRace = selected?.raceCalendar[0] ?? null;
  const isTargetRace = nextRace?.tag === 'ALVO';

  // Forma atual: consome a faixa resolvida pelo backend (sem recomputar limiar).
  // FAIXA_APRESENTACAO cobre as 9 faixas do contrato; faixa fora do mapa cai em
  // null e a UI exibe '—' (degrada sem quebrar).
  const currentFormDisplay = selected?.quickStats.statusForma ? FAIXA_APRESENTACAO[selected.quickStats.statusForma] : null;
  const acwrZone = getAcwrZone(selected?.quickStats.acwr ?? null);

  // A seleção acompanha a lista COMPOSTA, não só o roster: um atleta fixado pela fila de atenção
  // não está em `rosterItems`, e comparar com ele revertia a seleção para o primeiro do roster no
  // mesmo clique — o coach clicava no atleta em alerta e abria o detalhe de outro.
  useEffect(() => {
    if (inboxQueue.rows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !inboxQueue.rows.some((linha) => linha.atletaId === selectedId)) {
      setSelectedId(inboxQueue.rows[0].atletaId);
    }
  }, [inboxQueue.rows, selectedId]);

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

  /** Sinal do atleta selecionado, se ele estiver na fila de atenção. */
  /** Item bruto da fila de atenção do selecionado — o painel precisa de `evidence`/`explanation`. */
  const selectedAttentionItem = useMemo(
    () => dashboardAttentionQueue.find((item) => item.atletaId === selectedId) ?? null,
    [dashboardAttentionQueue, selectedId],
  );

  const selectedAttention = useMemo(
    () => inboxQueue.rows.find((linha) => linha.atletaId === selectedId)?.attention ?? null,
    [inboxQueue.rows, selectedId],
  );

  const primaryAction = useMemo(
    () => resolvePrimaryAction({
      planReviewStatus: selectedReviewStatus ? resolveReviewStatus(selectedReviewStatus) : null,
      planId: selectedPlanId,
      attention: selectedAttention,
    }),
    [selectedAttention, selectedPlanId, selectedReviewStatus],
  );

  const actionAvailability = resolveActionAvailability({
    acting: reviewIsActing,
    lastErrorStatus: reviewActionStatus,
  });

  const acionarContato = useCallback(async () => {
    if (!selected) return;
    const rascunho = montarRascunhoContato(selected.name, selectedAttention);
    try {
      await navigator.clipboard.writeText(rascunho);
      setFeedback('Rascunho copiado. Cole no seu canal de conversa com o atleta.');
    } catch {
      // Clipboard falha em contexto não-seguro e quando o usuário nega permissão. Sem este ramo, o
      // botão trocaria um stub silencioso por outro.
      setRascunhoContato(rascunho);
    }
  }, [selected, selectedAttention]);

  const acionarCta = useCallback(() => {
    if (primaryAction.kind === 'aprovar-plano') return void handleApprovePlan();
    if (primaryAction.kind === 'contatar-atleta') return void acionarContato();
    setActiveTab('plan');
  }, [acionarContato, handleApprovePlan, primaryAction.kind]);

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
          {/* Eyebrow em neutro: accent significa ação, e um rótulo estático não é acionável. */}
          <Typography sx={{ fontSize: '0.75rem', color: surface[400], fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Assistente do Treinador
          </Typography>
          {/*
            Título estático em 16px. Ele era o MAIOR texto da tela (23,2px) — chrome ganhando de
            conteúdo. Quem tem de dominar a tela é o nome do atleta selecionado, logo abaixo.
          */}
          <Typography
            data-testid="inbox-titulo"
            sx={{ fontSize: '1rem', fontWeight: 800, color: surface[50], lineHeight: 1.2 }}
          >
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
          // A busca vai para `q` do dashboard, que filtra o roster por nome — prometer treino e
          // prova era contrato que a tela não cumpre.
          placeholder="Buscar atleta..."
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

      {/*
        Loading e erro do dashboard viviam dentro do card removido. Sem eles, uma falha de carga
        deixaria a tela com números velhos e nenhuma indicação — pior que a coluna que saiu.
      */}
      {dashboardError ? (
        <Alert
          severity="warning"
          sx={{ mb: 1, color: surface[50], '& .MuiAlert-icon': { color: semantic.warning[500] } }}
          action={
            <Button size="small" onClick={reloadDashboard} sx={{ textTransform: 'none' }}>
              Tentar de novo
            </Button>
          }
        >
          Não foi possível carregar o dashboard agregado. Mantendo a tela funcional com os dados locais.
        </Alert>
      ) : null}
      {dashboardLoading ? <LinearProgress sx={{ mb: 1 }} /> : null}

      {/*
        "Resumo rápido" era um card ocupando uma coluna inteira, ao lado de dois previews que
        repetiam atletas já listados na coluna seguinte. Os previews saem — a lista principal agora
        carrega motivo e recência e fixa quem está em atenção (gate 1.1) — e os KPIs viram faixa.
      */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 1,
          mb: { xs: 1, lg: 1.25 },
        }}
      >
        <MetricTile compact label="Atletas ativos" value={String(summary.ativos)} delta={`${summary.totalAtletas} no total`} tone="success" />
        <MetricTile compact label="Treinos planejados" value={String(summary.treinosPlanejadosSemana)} delta="na semana" />
        <MetricTile compact label="Em atenção" value={String(summary.emAtencao)} delta={`${summary.itensFilaAtencao} na fila`} tone="warning" />
        <MetricTile compact label="Atletas exibidos" value={String(summary.atletasExibidos)} />
      </Box>
      {dashboardUpdatedAt ? (
        <Typography sx={{ fontSize: '0.7rem', color: surface[500], mb: { xs: 1, lg: 1.25 }, mt: -0.5 }}>
          Atualizado em {dashboardUpdatedAt}
        </Typography>
      ) : null}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            // Duas colunas: lista + detalhe. A terceira existia para os previews removidos, e
            // devolvê-la ao painel do atleta é o ponto — ele é o conteúdo, o resto era chrome.
            lg: 'minmax(300px, 360px) minmax(0, 1fr)',
            xl: 'minmax(340px, 400px) minmax(0, 1fr)',
          },
          '@media (min-width: 1800px)': {
            gridTemplateColumns: 'minmax(380px, 440px) minmax(0, 1fr)',
          },
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
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
            <Box sx={{ minWidth: 0 }}>
              {/*
                "Fila de revisão" era rótulo errado: esta coluna lista o ROSTER paginado, e a fila
                de revisão de planos é outra tela (/coach/planos/revisao). O nome enganoso foi o que
                levou a spec desta change a descrever um módulo que não existe aqui.
              */}
              <Typography sx={{ fontSize: '0.78rem', color: surface[400], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Atletas
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: surface[500] }} noWrap>
                {rosterItems.length} de {rosterTotal} · página {rosterHeaderLabel}
              </Typography>
            </Box>

            {/*
              Filtros vivem AQUI, não numa barra full-width acima dos KPIs: eles filtram só esta
              coluna, e um controle longe do que ele afeta faz o coach duvidar do que está vendo.
              A coluna tem ~300px, então são dois chips que abrem menu — dois `Select` não caberiam.
            */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <Chip
                size="small"
                clickable
                label={DASHBOARD_STATUS_OPTIONS.find((o) => o.key === dashboardStatus)?.label ?? 'Todos'}
                onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
                aria-label="Filtrar por status"
                sx={{
                  bgcolor: dashboardStatus === 'all' ? `${surface[0]}10` : `${semantic.warning[500]}1F`,
                  color: dashboardStatus === 'all' ? surface[300] : semantic.warning[500],
                  border: `1px solid ${dashboardStatus === 'all' ? content.cardBorder : `${semantic.warning[500]}55`}`,
                  fontWeight: 700,
                }}
              />
              {/*
                Ordenação era um `Select` na barra e um `Chip` no header — controle e display
                separados, mostrando a mesma coisa em dois lugares. Agora é um só.
              */}
              <Chip
                size="small"
                clickable
                label={currentSortLabel}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                aria-label="Ordenar lista"
                sx={{ bgcolor: `${surface[0]}10`, color: surface[300], border: `1px solid ${content.cardBorder}`, fontWeight: 700 }}
              />
            </Box>

            <Menu anchorEl={statusMenuAnchor} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}>
              {DASHBOARD_STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option.key}
                  selected={option.key === dashboardStatus}
                  onClick={() => {
                    handleDashboardStatusChange({ target: { value: option.key } });
                    setStatusMenuAnchor(null);
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>

            <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)}>
              {SORT_OPTIONS.map((option) => (
                <MenuItem
                  key={option.key}
                  selected={option.key === sortBy}
                  onClick={() => {
                    handleSortChange({ target: { value: option.key } });
                    setSortMenuAnchor(null);
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
              {dashboardStatus !== 'all' || search ? (
                <MenuItem
                  onClick={() => {
                    resetFilters();
                    setSortMenuAnchor(null);
                  }}
                >
                  Limpar filtros
                </MenuItem>
              ) : null}
            </Menu>
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
            {inboxQueue.hiddenAttentionCount > 0 ? (
              <Typography
                sx={{ fontSize: '0.72rem', color: semantic.warning[500], px: 0.5, pb: 0.5 }}
              >
                {inboxQueue.hiddenAttentionCount} atleta
                {inboxQueue.hiddenAttentionCount !== 1 ? 's' : ''} em atenção fora do filtro atual
              </Typography>
            ) : null}
            {/*
              Cinco estados distintos, porque três deles produziam a MESMA tela antes: durante o
              carregamento e depois de uma falha, a lista dizia "Nenhum atleta carregado" — afirmando
              ausência sem saber. E vazio-por-filtro pedia ação oposta a vazio-de-verdade: limpar o
              filtro vs. cadastrar atleta.
            */}
            {estadoDaLista === 'carregando' ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={22} />
                <Typography sx={{ color: surface[400], mt: 1.5, fontSize: '0.875rem' }}>
                  Carregando atletas…
                </Typography>
              </Box>
            ) : estadoDaLista === 'erro' ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                {/*
                  Sem botão de retry aqui: o alerta no topo da tela já oferece "Tentar de novo" para
                  a mesma requisição. Dois botões idênticos fazem o coach se perguntar se fazem
                  coisas diferentes.
                */}
                <Typography sx={{ color: surface[200], fontSize: '0.875rem' }}>
                  Não foi possível carregar a lista de atletas.
                </Typography>
              </Box>
            ) : estadoDaLista === 'vazio-filtrado' ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: surface[200], fontSize: '0.875rem' }}>
                  Nenhum atleta com este filtro.
                </Typography>
                <Button size="small" onClick={resetFilters} sx={{ mt: 1, textTransform: 'none' }}>
                  Limpar filtros
                </Button>
              </Box>
            ) : estadoDaLista === 'vazio' ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: surface[200], fontSize: '0.875rem' }}>
                  Nenhum atleta cadastrado ainda.
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTES.COACH_ATHLETES)}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Cadastrar atleta
                </Button>
              </Box>
            ) : (
              inboxQueue.rows.map((linha) => (
                linha.source === 'attention-only' ? (
                  <AttentionOnlyRow
                    key={linha.atletaId}
                    atletaId={linha.atletaId}
                    athleteName={linha.athleteName}
                    attention={linha.attention}
                    selected={linha.atletaId === selectedId}
                    onClick={() => setSelectedId(linha.atletaId)}
                  />
                ) : (
                  <QueueRow
                    key={linha.atletaId}
                    athlete={linha.row}
                    attention={linha.attention}
                    selected={linha.atletaId === selectedId}
                    onClick={() => setSelectedId(linha.atletaId)}
                  />
                )
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
                      <Typography data-testid="inbox-nome-atleta" sx={{ fontSize: { xs: '1.25rem', sm: '1.4rem', lg: '1.5rem', xl: '1.55rem' }, fontWeight: 800, color: surface[50], lineHeight: 1.05, fontFamily: 'Syne, sans-serif' }}>
                        {selected.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={selected.statusLabel}
                        sx={{
                          fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.6875rem', xl: '0.6875rem' },
                          fontWeight: 700,
                          color: selectedPalette.fg,
                          bgcolor: selectedPalette.bg,
                          border: `1px solid ${selectedPalette.border}`,
                        }}
                      />
                    </Box>
                    {selected.nivelExperiencia ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.15 }}>
                        <Typography component="span" sx={{ fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.76rem', xl: '0.8rem' }, color: surface[400] }}>
                          {selected.nivelExperiencia}
                        </Typography>
                        {selected.age > 0 ? (
                          <Chip
                            size="small"
                            label={`${selected.age} anos`}
                            sx={{ height: 18, fontSize: '0.6875rem', bgcolor: `${surface[500]}20`, color: surface[200] }}
                          />
                        ) : null}
                      </Box>
                    ) : null}
                    <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.6875rem', xl: '0.8rem' }, color: surface[400], mt: 0.2 }}>
                      {selected.discipline}
                    </Typography>
                  </Box>
                </Box>

                {/*
                  Ação primária no CABEÇALHO, não no rodapé. A auditoria mediu o antigo "Aprovar
                  plano" a y=863 — na borda da dobra, 28px de altura, e cinza no estado comum. Aqui
                  ele fica ao lado do nome do atleta, com altura e fonte legíveis, e **troca** de
                  ação conforme o estado em vez de aparecer morto.
                */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    data-testid="inbox-cta-primario"
                    variant={primaryAction.primary ? 'contained' : 'outlined'}
                    onClick={acionarCta}
                    disabled={actionAvailability === 'loading' || actionAvailability === 'forbidden'}
                    startIcon={actionAvailability === 'loading' ? <CircularProgress size={16} color="inherit" /> : undefined}
                    sx={{
                      minHeight: 40,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      // Lime é ação primária; navegação ("Abrir plano") sai em neutro de propósito.
                      ...(primaryAction.primary ? PRIMARY_BTN_SX : {}),
                    }}
                  >
                    {actionAvailability === 'loading' ? 'Enviando…' : primaryAction.label}
                  </Button>

                  {/*
                    Rejeitar sai do menu "Mais ações" e fica ao lado de aprovar: são as duas faces
                    da mesma decisão, e esconder a que exige motivo escrito enviesa a escolha.
                  */}
                  {primaryAction.kind === 'aprovar-plano' ? (
                    <Button
                      variant="outlined"
                      onClick={openRejectDialog}
                      disabled={actionAvailability === 'loading' || actionAvailability === 'forbidden'}
                      sx={{ minHeight: 40, fontSize: '0.875rem', textTransform: 'none', color: surface[200], borderColor: content.cardBorder }}
                    >
                      Rejeitar
                    </Button>
                  ) : null}

                  {actionAvailability === 'stale' ? (
                    <Typography sx={{ fontSize: '0.75rem', color: semantic.warning[500] }}>
                      O plano mudou em outra sessão. Recarregue para ver o estado atual.
                    </Typography>
                  ) : null}
                  {actionAvailability === 'forbidden' ? (
                    <Typography sx={{ fontSize: '0.75rem', color: semantic.warning[500] }}>
                      Você não tem permissão para esta ação.
                    </Typography>
                  ) : null}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.05, lg: 1.45, xl: 2 }, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.6875rem', xl: '0.6875rem' }, color: surface[500], textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aderência geral</Typography>
                    <Typography sx={{ fontSize: { xs: '1.08rem', sm: '1.18rem', lg: '1.28rem', xl: '1.5rem' }, fontWeight: 800, color: selected.adherence >= 85 ? semantic.success[500] : selected.adherence >= 70 ? surface[50] : semantic.warning[500] }}>
                      {formatPercent(selected.adherence)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.6875rem', xl: '0.6875rem' }, color: surface[500], textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carga semanal</Typography>
                    <Typography sx={{ fontSize: { xs: '1.08rem', sm: '1.18rem', lg: '1.28rem', xl: '1.5rem' }, fontWeight: 800, color: surface[50] }}>
                      {formatKm(selected.load7d)}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.7rem', lg: '0.74rem', xl: '0.78rem' }, color: selected.loadDelta >= 0 ? semantic.success[500] : semantic.danger[500] }}>
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
                  value={currentFormDisplay?.label ?? '—'}
                  delta={selected.quickStats.tsb != null ? `TSB ${selected.quickStats.tsb}` : 'TSB não disponível'}
                  tone={currentFormDisplay?.tone ?? 'neutral'}
                />
                <MetricTile
                  compact
                  label="ACWR"
                  value={selected.quickStats.acwr != null ? selected.quickStats.acwr.toFixed(2) : '—'}
                  delta={selected.quickStats.acwr != null ? acwrZone.label : 'Dado insuficiente'}
                  tone={acwrZone.tone}
                />
                <MetricTile compact label={isTargetRace ? 'Prova Alvo' : 'Próxima Prova'} delta={selected.raceCalendar[0]?.date ?? '—'} value={selected.raceCalendar[0]?.label ?? 'Sem prova'} tone={isTargetRace ? 'warning' : 'neutral'} highlight={isTargetRace} />
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
                    // Tabs são navegação interna do painel, não ação primária — neutro alto contraste.
                    '& .Mui-selected': { color: surface[50] },
                    '& .MuiTabs-indicator': { backgroundColor: surface[50] },
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

                {/*
                  O painel monta a partir do resumo do roster e completa com o perfil. Enquanto
                  ele carrega — ou quando falha — a tela exibia os dados parciais sem dizer nada,
                  e o coach não tinha como saber se "—" era ausência de dado ou dado ainda a
                  caminho. A faixa avisa sem esconder o que já se sabe.
                */}
                {profileLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                    <CircularProgress size={14} />
                    <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>
                      Carregando o detalhe do atleta…
                    </Typography>
                  </Box>
                ) : profileError ? (
                  <Alert
                    severity="warning"
                    sx={{ mb: 1.25, py: 0.25 }}
                    action={
                      <Button size="small" onClick={() => void fetchSelectedProfile()} sx={{ textTransform: 'none' }}>
                        Tentar de novo
                      </Button>
                    }
                  >
                    Não foi possível carregar o detalhe deste atleta.
                  </Alert>
                ) : null}

                {activeTab === 'diagnosis' ? (
                  <DiagnosisTabPanel
                    selected={selected}
                    attentionItem={selectedAttentionItem}
                    attentionRecencyDays={selectedAttention?.recencyDays ?? null}
                    limiareisInferidos={selectedProfile?.limiareisInferidos ?? null}
                    pmc={selectedPmc}
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

      {/*
        Fallback do "Contato assistido": `navigator.clipboard` falha em contexto não-seguro e quando
        a permissão é negada. Sem este dialog, o botão trocaria o toast vazio antigo por um silêncio
        novo — o coach clicaria e nada aconteceria, de novo.
      */}
      <Dialog open={rascunhoContato != null} onClose={() => setRascunhoContato(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Rascunho da mensagem</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.8rem', color: surface[400], mb: 1.5 }}>
            Não foi possível copiar automaticamente. Selecione o texto abaixo e copie.
          </Typography>
          <TextField
            multiline
            fullWidth
            minRows={6}
            value={rascunhoContato ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRascunhoContato(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CoachInboxPage;
