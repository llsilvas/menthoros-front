import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import type { CoachRoute } from '../../../constants/routes';
import CoachSidebar from './CoachSidebar';

// Mock para desenvolvimento — será substituído por dados reais do contexto de autenticação
const mockCoach = { id: 'mock', name: 'Coach', avatarUrl: undefined };
const mockTenant = { id: 'mock', name: 'Assessoria Piloto', athleteCount: 0 };

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

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
        coach={mockCoach}
        currentTenant={mockTenant}
        onNavigate={handleNavigate}
      />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
