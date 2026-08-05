import { useEffect, useRef, useState } from 'react';
import { AVATAR_IMG_SLOT_PROPS, safeAvatarSrc } from '../../../shared/components/avatarSrc';
import {
  Avatar,
  Box,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InboxIcon from '@mui/icons-material/Inbox';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SettingsIcon from '@mui/icons-material/Settings';

import type { CoachRoute } from '../../../constants/routes';
import { content, gradients, semantic, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { activeTheme } from '../../../theme/activeTheme';
import menthorosMark from '../../../assets/icons/menthoros_mark.png';

const { primary, sidebar, overlayBlack } = activeTheme;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantInfo {
  id: string;
  name: string;
  athleteCount: number;
}

interface CoachInfo {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface CoachSidebarProps {
  activeRoute: CoachRoute;
  coach: CoachInfo;
  currentTenant: TenantInfo;
  availableTenants?: TenantInfo[];
  inboxBadgeCount?: number;
  reviewBadgeCount?: number;
  onNavigate: (route: CoachRoute) => void;
  onTenantSwitch?: (tenantId: string) => void;
}

// ── Nav items ─────────────────────────────────────────────────────────────────

type NavItemDef = {
  route: CoachRoute;
  label: string;
  Icon: React.ElementType;
};

const NAV_ITEMS: NavItemDef[] = [
  { route: '/coach/inbox',           label: 'Inbox',             Icon: InboxIcon },
  { route: '/coach/athletes',        label: 'Atletas',           Icon: PeopleIcon },
  { route: '/coach/calendar',        label: 'Calendário',        Icon: CalendarMonthIcon },
  { route: '/coach/insights',        label: 'Insights',          Icon: InsightsIcon },
  { route: '/coach/planos/revisao',  label: 'Revisão de planos', Icon: RateReviewIcon },
  { route: '/coach/settings',        label: 'Configurações',      Icon: SettingsIcon },
];

// ── Dimensions ────────────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;
const LS_KEY = 'coach-sidebar-collapsed';

// ── InboxBadge ────────────────────────────────────────────────────────────────

function InboxBadge({
  count,
  position,
}: {
  count: number;
  position: 'inline' | 'icon-overlay';
}) {
  if (count <= 0) return null;

  if (position === 'icon-overlay') {
    return (
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: semantic.danger[500],
          color: surface[50],
          fontSize: '0.6rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 0.25,
          lineHeight: 1,
        }}
      >
        {count > 99 ? '99+' : count}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        ml: 'auto',
        minWidth: 20,
        height: 20,
        borderRadius: '50%',
        bgcolor: semantic.danger[500],
        color: surface[50],
        fontSize: '0.65rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 0.5,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {count > 99 ? '99+' : count}
    </Box>
  );
}

// ── TenantSwitcher ────────────────────────────────────────────────────────────

interface TenantSwitcherProps {
  currentTenant: TenantInfo;
  availableTenants?: TenantInfo[];
  onTenantSwitch?: (tenantId: string) => void;
  collapsed: boolean;
}

function TenantSwitcher({
  currentTenant,
  availableTenants,
  onTenantSwitch,
  collapsed,
}: TenantSwitcherProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const hasOptions =
    Array.isArray(availableTenants) && availableTenants.length > 0;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (hasOptions) setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (tenantId: string) => {
    onTenantSwitch?.(tenantId);
    handleClose();
  };

  const triggerContent = (
    <Box
      onClick={handleOpen}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: collapsed ? 0 : 1,
        py: 0.75,
        borderRadius: 1,
        cursor: hasOptions ? 'pointer' : 'default',
        color: sidebar.text,
        transition: 'background 150ms ease-out',
        ...(hasOptions && {
          '&:hover': {
            bgcolor: sidebar.hoverBg,
            color: sidebar.textHover,
          },
        }),
        justifyContent: collapsed ? 'center' : 'flex-start',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          bgcolor: `${primary[500]}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: primary[500],
            lineHeight: 1,
          }}
        >
          {currentTenant.name.slice(0, 2).toUpperCase()}
        </Typography>
      </Box>

      {!collapsed && (
        <>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2, color: 'inherit' }}
            >
              {currentTenant.name}
            </Typography>
            <Typography
              noWrap
              sx={{ fontSize: '0.65rem', color: surface[500], lineHeight: 1.2, mt: 0.25 }}
            >
              {currentTenant.athleteCount} atleta
              {currentTenant.athleteCount !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {hasOptions && (
            <ExpandMoreIcon sx={{ fontSize: 16, flexShrink: 0, color: sidebar.text }} />
          )}
        </>
      )}
    </Box>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip title={currentTenant.name} placement="right">
          {triggerContent}
        </Tooltip>
      ) : (
        triggerContent
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: elevation.highest,
              border: `1px solid ${content.cardBorder}`,
              boxShadow: `0 4px 12px ${overlayBlack[40]}`,
              minWidth: 200,
              mt: -1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        {availableTenants?.map((t) => (
          <MenuItem
            key={t.id}
            selected={t.id === currentTenant.id}
            onClick={() => handleSelect(t.id)}
            sx={{
              color: surface[50],
              fontSize: '0.8rem',
              '&.Mui-selected': {
                bgcolor: `${primary[500]}1A`,
                '&:hover': { bgcolor: `${primary[500]}26` },
              },
              '&:hover': { bgcolor: `${surface[0]}0F` },
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {t.name}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: surface[400] }}>
                {t.athleteCount} atleta{t.athleteCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ── CoachSidebar ──────────────────────────────────────────────────────────────

export default function CoachSidebar({
  activeRoute,
  coach,
  currentTenant,
  availableTenants,
  inboxBadgeCount = 0,
  reviewBadgeCount = 0,
  onNavigate,
  onTenantSwitch,
}: CoachSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(LS_KEY) === 'true',
  );

  const toggleRef = useRef(collapsed);
  toggleRef.current = collapsed;

  // Keyboard shortcut: [ toggles collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '[') {
        const next = !toggleRef.current;
        setCollapsed(next);
        localStorage.setItem(LS_KEY, String(next));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(LS_KEY, String(next));
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <Box
      component="nav"
      aria-label="Coach navigation"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        height: '100%',
        background: gradients.sidebar,
        borderRight: `1px solid ${content.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 200ms ease-out',
        position: 'relative',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          py: 1.5,
          minHeight: 56,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box
              component="img"
              src={menthorosMark}
              alt="Menthoros"
              sx={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                userSelect: 'none',
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: primary[500],
                letterSpacing: '-0.02em',
                userSelect: 'none',
              }}
            >
              Menthoros
            </Typography>
          </Box>
        )}

        <Tooltip title={collapsed ? 'Expandir sidebar  [ ' : 'Recolher sidebar  [ '} placement="right">
          <Box
            component="button"
            onClick={handleToggle}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 1,
              border: `1px solid ${content.cardBorder}`,
              bgcolor: 'transparent',
              color: sidebar.text,
              cursor: 'pointer',
              flexShrink: 0,
              p: 0,
              transition: 'background 150ms ease-out, color 150ms ease-out',
              '&:hover': {
                bgcolor: sidebar.hoverBg,
                color: sidebar.textHover,
              },
            }}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            )}
          </Box>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: sidebar.divider, mx: collapsed ? 1 : 0 }} />

      {/* ── Nav items ──────────────────────────────────────────────────────── */}
      <Box
        component="ul"
        role="list"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          px: collapsed ? 0.75 : 1,
          listStyle: 'none',
          m: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        {NAV_ITEMS.map(({ route, label, Icon }) => {
          const isActive = activeRoute === route;
          const isInbox = route === '/coach/inbox';
          const isReview = route === '/coach/planos/revisao';
          const badgeCount = isInbox ? inboxBadgeCount : (isReview ? reviewBadgeCount : 0);
          const showBadge = badgeCount > 0;

          const itemContent = (
            <Box
              component="li"
              key={route}
              role="listitem"
            >
              <Box
                component="button"
                onClick={() => onNavigate(route)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(route);
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  width: '100%',
                  px: collapsed ? 0 : 1.25,
                  py: 0.875,
                  borderRadius: 1,
                  border: 'none',
                  borderLeft: isActive
                    ? `3px solid ${primary[500]}`
                    : '3px solid transparent',
                  bgcolor: isActive ? `${primary[500]}1A` : 'transparent',
                  color: isActive ? primary[500] : sidebar.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 150ms ease-out, color 150ms ease-out',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  '&:hover': isActive
                    ? {}
                    : { bgcolor: sidebar.hoverBg, color: sidebar.textHover },
                }}
              >
                {/* Icon wrapper — relative so overlay badge can position */}
                <Box sx={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                  <Icon sx={{ fontSize: 20 }} />
                  {collapsed && showBadge && (
                    <InboxBadge count={badgeCount} position="icon-overlay" />
                  )}
                </Box>

                {!collapsed && (
                  <>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 400,
                        lineHeight: 1,
                        flex: 1,
                        color: 'inherit',
                        userSelect: 'none',
                      }}
                    >
                      {label}
                    </Typography>

                    {showBadge && (
                      <InboxBadge count={badgeCount} position="inline" />
                    )}
                  </>
                )}
              </Box>
            </Box>
          );

          if (collapsed) {
            return (
              <Tooltip key={route} title={label} placement="right">
                {/* Tooltip requires a single child that can receive a ref */}
                <Box component="span" sx={{ display: 'block' }}>
                  {itemContent}
                </Box>
              </Tooltip>
            );
          }

          return itemContent;
        })}
      </Box>

      <Divider sx={{ borderColor: sidebar.divider, mx: collapsed ? 1 : 0 }} />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: 1,
          px: collapsed ? 0.75 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        {/* Coach info */}
        {collapsed ? (
          <Tooltip title={coach.name} placement="right">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 0.75,
              }}
            >
              <Avatar
                src={safeAvatarSrc(coach.avatarUrl)}
                alt={coach.name}
                slotProps={AVATAR_IMG_SLOT_PROPS}
                sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: `${primary[500]}26`, color: primary[500] }}
              >
                {coach.name.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.75,
            }}
          >
            <Avatar
              src={safeAvatarSrc(coach.avatarUrl)}
              alt={coach.name}
              slotProps={AVATAR_IMG_SLOT_PROPS}
              sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: `${primary[500]}26`, color: primary[500], flexShrink: 0 }}
            >
              {coach.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              noWrap
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: sidebar.textHover,
                lineHeight: 1,
                flex: 1,
                minWidth: 0,
              }}
            >
              {coach.name}
            </Typography>
          </Box>
        )}

        {/* Tenant switcher */}
        <TenantSwitcher
          currentTenant={currentTenant}
          availableTenants={availableTenants}
          onTenantSwitch={onTenantSwitch}
          collapsed={collapsed}
        />
      </Box>
    </Box>
  );
}
