import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import type { CoachRoute } from '../../../constants/routes';
import CoachSidebar from './CoachSidebar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useAttentionQueue } from '../../../hooks/useAttentionQueue';
import { useCoachPlanReview } from '../../../hooks/useCoachPlanReview';
import type { CoachAttentionItem } from '../../../types/Coach';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

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
  reviewFetchPendentes: () => Promise<void>;
  reviewAprovar: (id: string) => Promise<void>;
  reviewRejeitar: (id: string, motivo: string) => Promise<void>;
}

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { coach, tenant, fetchCurrentUser } = useCurrentUser();
  const { queue, loading: queueLoading, error: queueError, fetchQueue } = useAttentionQueue();
  const {
    pendentes,
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

  const activeRoute = (location.pathname as CoachRoute) ?? '/coach/inbox';

  const handleNavigate = (route: CoachRoute) => {
    navigate(route);
  };

  const outletContext: CoachLayoutOutletContext = {
    queue,
    queueLoading,
    queueError,
    refetchQueue: fetchQueue,
    reviewPendentes: pendentes,
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
        reviewBadgeCount={pendentes.length}
        onNavigate={handleNavigate}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet context={outletContext} />
      </Box>
    </Box>
  );
}
