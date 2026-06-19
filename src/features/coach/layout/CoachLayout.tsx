import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import type { CoachRoute } from '../../../constants/routes';
import CoachSidebar from './CoachSidebar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useAttentionQueue } from '../../../hooks/useAttentionQueue';

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { coach, tenant, fetchCurrentUser } = useCurrentUser();
  const { queue, fetchQueue } = useAttentionQueue();

  useEffect(() => {
    fetchCurrentUser();
    fetchQueue();
  }, [fetchCurrentUser, fetchQueue]);

  const activeRoute = (location.pathname as CoachRoute) ?? '/coach/inbox';

  const handleNavigate = (route: CoachRoute) => {
    navigate(route);
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
        onNavigate={handleNavigate}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
