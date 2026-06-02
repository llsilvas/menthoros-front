import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import { AthleteBottomNav } from '../../../shared/components/AthleteBottomNav';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import type { AthleteRoute } from '../../../constants/routes';

export default function AthleteLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeRoute = location.pathname as AthleteRoute;

  function handleNavigate(route: AthleteRoute) {
    navigate(route);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: elevation.base,
        overflow: 'hidden',
      }}
    >
      <ErrorBoundary>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </ErrorBoundary>
      <AthleteBottomNav
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
      />
    </Box>
  );
}
