import { useCallback, useEffect } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import type { CoachRoute } from '../../../constants/routes';
import CoachSidebar from './CoachSidebar';
import { CoachWelcomeWizard } from '../components/CoachWelcomeWizard';
import { CoachConsentDialog } from '../components/CoachConsentDialog';
import { UsuarioService } from '../../../api/services/UsuarioService';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import type { CurrentCoach, CurrentConsent } from '../../../hooks/useCurrentUser';
import { useAttentionQueue } from '../../../hooks/useAttentionQueue';
import { useCoachPlanReview } from '../../../hooks/useCoachPlanReview';
import type { CoachAttentionItem } from '../../../types/Coach';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import type { ReviewActionResult, ReviewFilter } from '../../../hooks/useCoachPlanReview';

export interface CoachLayoutOutletContext {
  /**
   * Identidade e consentimento já resolvidos pelo layout.
   *
   * Estão aqui porque `useCurrentUser` não busca sozinho: uma página que chamasse o hook de novo
   * criaria estado próprio e ficaria em fallback vazio para sempre, e disparar o fetch nela
   * duplicaria o `GET /users/me` que o layout já fez.
   */
  coach: CurrentCoach;
  consent: CurrentConsent;
  queue: CoachAttentionItem[];
  queueLoading: boolean;
  queueError: Error | null;
  refetchQueue: () => Promise<void>;
  reviewPendentes: PlanoSemanalDto[];
  reviewIsFetching: boolean;
  reviewIsActing: boolean;
  reviewFetchError: Error | null;
  reviewActionError: Error | null;
  /** Status HTTP da última falha de ação — distingue 409/422 (stale) de 403 (sem permissão). */
  reviewActionStatus: number | null;
  reviewActiveFilter: ReviewFilter;
  reviewSetFilter: (f: ReviewFilter) => void;
  reviewFetchPendentes: () => Promise<void>;
  reviewAprovar: (id: string) => Promise<ReviewActionResult>;
  reviewRejeitar: (id: string, motivo: string) => Promise<ReviewActionResult>;
}

const telaCheia = {
  display: 'flex',
  height: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: elevation.base,
  p: 2,
} as const;

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { coach, tenant, consent, onboardingConcluido, loading: userLoading, error: userError, fetchCurrentUser } = useCurrentUser();
  const { queue, loading: queueLoading, error: queueError, fetchQueue } = useAttentionQueue();
  const {
    allPlanos,
    pendentes,
    activeFilter: reviewActiveFilter,
    setFilter: reviewSetFilter,
    isFetching: reviewIsFetching,
    isActing: reviewIsActing,
    fetchError: reviewFetchError,
    actionError: reviewActionError,
    actionStatus: reviewActionStatus,
    fetchPendentes,
    aprovar,
    rejeitar,
  } = useCoachPlanReview();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // As buscas do dashboard esperam os DOIS gates. Antes elas saíam junto com o `me`, e o gate
  // existia só no render: o consentimento e o wizard cobriam a tela enquanto fila e revisões já
  // tinham sido pedidas por trás — respostas que ninguém consome, e 403 no console quando o
  // enforcement de consentimento está ligado.
  const liberado = consent.granted === true && onboardingConcluido === true;

  useEffect(() => {
    if (!liberado) return;
    fetchQueue();
    fetchPendentes();
  }, [liberado, fetchQueue, fetchPendentes]);

  const handleAcceptConsent = useCallback(
    async (versoes: { policyVersion: string; termsVersion: string }) => {
      await UsuarioService.registrarConsentimento({
        termsAccepted: true,
        privacyPolicyAccepted: true,
        ...versoes,
      });
      // Revalidar é o que libera o shell: sem o refetch o modal continuaria montado após o 200.
      await fetchCurrentUser();
    },
    [fetchCurrentUser],
  );

  // 409 CONSENT_VERSION_STALE: as versões mudaram no servidor. Sem recarregar `me`, o dialog
  // continuaria com as versões antigas em prop e o próximo aceite tomaria 409 de novo — laço
  // infinito até o usuário recarregar a página na mão.
  const handleConsentVersionStale = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Enquanto `me` não respondeu, não renderiza nem o shell nem o modal. Liberar o shell no
  // indefinido deixava sidebar e Outlet aparecerem — e os fetches da fila e da revisão dispararem —
  // antes de saber se o coach consentiu; com enforcement ligado, essas chamadas voltariam 403 e o
  // coach veria erro cru no lugar do gate. Tratar o indefinido como `false`, por outro lado, faria o
  // modal piscar em todo carregamento.
  // Erro antes do spinner: se `me` falha, `loading` volta a false mas `consent.granted` fica em
  // `null` (o fallback do hook). Sem este ramo o coach ficaria preso num spinner para sempre, sem
  // mensagem e sem como tentar de novo.
  if (userError) {
    return (
      <Box sx={telaCheia}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => { void fetchCurrentUser(); }}>Tentar de novo</Button>}
        >
          Não foi possível carregar seus dados.
        </Alert>
      </Box>
    );
  }

  if (userLoading || consent.granted === null || onboardingConcluido === null) {
    return (
      <Box sx={telaCheia}>
        <CircularProgress />
      </Box>
    );
  }

  if (consent.granted === false) {
    return (
      <CoachConsentDialog
        open
        policyVersion={consent.policyVersion}
        termsVersion={consent.termsVersion}
        onAccept={handleAcceptConsent}
        onVersionStale={handleConsentVersionStale}
      />
    );
  }

  // Onboarding vem DEPOIS do consentimento, e a ordem importa: o wizard escreve dados (nome da
  // assessoria, primeiro atleta). Montá-lo antes do aceite faria o coach gravar informação no
  // produto antes de concordar com os termos — invertendo a garantia que a change de consentimento
  // estabeleceu.
  if (onboardingConcluido === false) {
    return <CoachWelcomeWizard onConcluido={fetchCurrentUser} />;
  }

  const activeRoute = resolverRotaAtiva(location.pathname);

  const handleNavigate = (route: CoachRoute) => {
    navigate(route);
  };

  const reviewBadgeCount = allPlanos.filter(p => resolveReviewStatus(p.reviewStatus) === 'AGUARDANDO_REVISAO').length;

  const outletContext: CoachLayoutOutletContext = {
    coach,
    consent,
    queue,
    queueLoading,
    queueError,
    refetchQueue: fetchQueue,
    reviewPendentes: pendentes,
    reviewActiveFilter,
    reviewSetFilter,
    reviewIsFetching,
    reviewIsActing,
    reviewFetchError,
    reviewActionError,
    reviewActionStatus,
    reviewFetchPendentes: fetchPendentes,
    reviewAprovar: aprovar,
    reviewRejeitar: rejeitar,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: elevation.base,
        overflow: 'hidden',
      }}
    >
      <CoachSidebar
        activeRoute={activeRoute}
        coach={coach}
        currentTenant={tenant}
        inboxBadgeCount={queue.length}
        reviewBadgeCount={reviewBadgeCount}
        onNavigate={handleNavigate}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet context={outletContext} />
      </Box>
    </Box>
  );
}

/**
 * Resolve qual item da sidebar fica ativo.
 *
 * Era `location.pathname as CoachRoute`, comparação exata — com a sub-rota
 * `/coach/settings/assessoria` nenhum item casaria e a sidebar ficaria sem destaque nenhum,
 * deixando o coach sem saber onde está. Aqui vence o prefixo mais longo, então
 * `/coach/settings/assessoria` mantém "Configurações" aceso.
 */
function resolverRotaAtiva(pathname: string): CoachRoute {
  const rotas: CoachRoute[] = [
    '/coach/inbox',
    '/coach/athletes',
    '/coach/calendar',
    '/coach/insights',
    '/coach/planos/revisao',
    '/coach/settings',
  ];

  return rotas
    .filter((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
    .sort((a, b) => b.length - a.length)[0] ?? '/coach/inbox';
}
