import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import { surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// CoachSidebar will replace this placeholder in the standardize-coach-shell-ux sprint
function CoachSidebarPlaceholder() {
  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        height: '100%',
        bgcolor: elevation.panel,
        borderRight: `1px solid ${content.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1,
      }}
    >
      <Box
        sx={{
          height: 40,
          borderRadius: 1,
          bgcolor: `${surface[0]}0A`,
          border: `1px solid ${content.cardBorder}`,
          mb: 2,
        }}
      />
      {['Inbox', 'Atletas', 'Calendário', 'Insights'].map((label) => (
        <Box
          key={label}
          sx={{
            height: 36,
            borderRadius: 1,
            bgcolor: `${surface[0]}06`,
            border: `1px solid ${content.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            fontSize: '0.85rem',
            color: surface[400],
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
}

export default function CoachLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: elevation.base,
        overflow: 'hidden',
      }}
    >
      <CoachSidebarPlaceholder />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
