import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router';
import ThemeSwitcher from './ThemeSwitcher';
import { gradients, glass } from '../../theme/tokens';
import { useAuth } from '../../context/auth/AuthContext';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: glass.border,
  boxShadow: 'none',
  background: gradients.header,
  backdropFilter: glass.backdropFilter,
  WebkitBackdropFilter: glass.backdropFilter,
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled('div')({
  position: 'relative',
  height: 44,
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.12)',
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  '& img': {
    maxHeight: 44,
  },
});

export interface DashboardHeaderProps {
  logo?: React.ReactNode;
  title?: string;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
}

export default function DashboardHeader({
  logo,
  title,
  menuOpen,
  onToggleMenu,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = React.useCallback(() => {
    onToggleMenu(!menuOpen);
  }, [menuOpen, onToggleMenu]);

  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = 'Expand';
      const collapseMenuActionText = 'Collapse';

      return (
        <Tooltip
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
          enterDelay={1000}
        >
          <div>
            <IconButton
              size="small"
              aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText} navigation menu`}
              onClick={handleMenuOpen}
              sx={{ color: 'white' }}
            >
              {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </div>
        </Tooltip>
      );
    },
    [handleMenuOpen],
  );

  return (
    <AppBar color="primary" position="absolute" sx={{ displayPrint: 'none' }}>
      <Toolbar sx={{ mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <Stack direction="row" alignItems="center">
            <Box sx={{ mr: 1 }}>{getMenuIcon(menuOpen)}</Box>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Stack direction="row" alignItems="center">
                {logo ? <LogoContainer>{logo}</LogoContainer> : null}
                {title ? (
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: '700',
                      ml: 1,
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
                  >
                    {title}
                  </Typography>
                ) : null}
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginLeft: 'auto' }}
          >
            <Stack direction="row" alignItems="center">
              <ThemeSwitcher />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              {user && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                    {user.name}
                  </Typography>
                  {user.role && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>
                      {user.role}
                    </Typography>
                  )}
                </Box>
              )}
              <Tooltip title={user?.username ?? 'Usuário'}>
                <Avatar
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                  }}
                >
                  {user?.initials ?? 'U'}
                </Avatar>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled sx={{ opacity: '1 !important' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user?.username}</Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  Sair
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
