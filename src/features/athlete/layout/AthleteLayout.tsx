import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import { elevation } from '../../../shared/design-tokens';

// AthleteBottomNav will replace this placeholder in the refine-athlete-shell-ux sprint
function AthleteBottomNavPlaceholder() {
  return (
    <Box
      sx={{
        height: 56,
        flexShrink: 0,
        bgcolor: elevation.panel,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        px: 2,
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.3)',
        // safe-area for iOS notch
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {['Hoje', 'Plano', 'Progresso', 'Coach', 'Perfil'].map((label) => (
        <Box
          key={label}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            opacity: 0.4,
          }}
        >
          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)' }} />
          {label}
        </Box>
      ))}
    </Box>
  );
}

export default function AthleteLayout() {
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
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
      <AthleteBottomNavPlaceholder />
    </Box>
  );
}
