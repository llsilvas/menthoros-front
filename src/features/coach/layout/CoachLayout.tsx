import { useCallback, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import type { CoachRoute } from '../../../constants/routes';
import CoachSidebar from './CoachSidebar';
import { CoachConsentDialog } from '../components/CoachConsentDialog';
import { UsuarioService } from '../../../api/services/UsuarioService';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useAttentionQueue } from '../../../hooks/useAttentionQueue';
import { useCoachPlanReview } from '../../../hooks/useCoachPlanReview';
import type { CoachAttentionItem } from '../../../types/Coach';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import type { ReviewFilter } from '../../../hooks/useCoachPlanReview';

export interface CoachLayoutOutletContext {
  queue: CoachAttentionItem[];
  queueLoading: boolean;
  queueError: Error | null;
  refetchQueue: () => Promise<void>;
  reviewPendentes: PlanoSemanalDto[];
  reviewIsFetching: boolean;
  reviewIsActing: boolean;
  reviewFetchError: Error | null;
  reviewActionError: Error | null;
  reviewActiveFilter: ReviewFilter;
  reviewSetFilter: (f: ReviewFilter) => void;
  reviewFetchPendentes: () => Promise<void>;
  reviewAprovar: (id: string) => Promise<boolean>;
  reviewRejeitar: (id: string, motivo: string) => Promise<boolean>;
}

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { coach, tenant, consent, loading: userLoading, fetchCurrentUser } = useCurrentUser();
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
    fetchPendentes,
    aprovar,
    rejeitar,
  } = useCoachPlanReview();

  useEffect(() => {
    fetchCurrentUser();
    fetchQueue();
    fetchPendentes();
  }, [fetchCurrentUser, fetchQueue, fetchPendentes]);

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
  if (userLoading || consent.granted === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: elevation.base,
        }}
      >
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

  const activeRoute = (location.pathname as CoachRoute) ?? '/coach/inbox';

  const handleNavigate = (route: CoachRoute) => {
    navigate(route);
  };

  const reviewBadgeCount = allPlanos.filter(p => resolveReviewStatus(p.reviewStatus) === 'AGUARDANDO_REVISAO').length;

  const outletContext: CoachLayoutOutletContext = {
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
