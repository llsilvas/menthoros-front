import { Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import type { AthleteRoute } from '../../constants/routes';
import { elevation } from '../design-tokens/elevation';
import { primary, surface, semantic } from '../design-tokens/colors';
import { content } from '../../theme/tokens';

interface AthleteBottomNavProps {
  activeRoute: AthleteRoute;
  unreadCoachMessages?: number; // badge no item Coach
  onNavigate: (route: AthleteRoute) => void;
}

const NAV_ITEMS = [
  { route: '/athlete/home',     label: 'Hoje',      Icon: HomeIcon      },
  { route: '/athlete/plan',     label: 'Plano',     Icon: EventNoteIcon },
  { route: '/athlete/progress', label: 'Progresso', Icon: TrendingUpIcon },
  { route: '/athlete/coach',    label: 'Coach',     Icon: ForumIcon     },
  { route: '/athlete/profile',  label: 'Perfil',    Icon: PersonIcon    },
] as const satisfies ReadonlyArray<{ route: AthleteRoute; label: string; Icon: React.ElementType }>;

export function AthleteBottomNav({
  activeRoute,
  unreadCoachMessages = 0,
  onNavigate,
}: AthleteBottomNavProps) {
  return (
    <Box
      component="nav"
      role="navigation"
      aria-label="Navegação do atleta"
      sx={{
        height: 56,
        flexShrink: 0,
        bgcolor: elevation.panel,
        borderTop: `1px solid ${content.divider}`,
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ route, label, Icon }) => {
        const isActive = activeRoute === route;
        const isCoach = route === '/athlete/coach';
        const showBadge = isCoach && unreadCoachMessages > 0;

        return (
          <Box
            key={route}
            component="button"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(route)}
            sx={{
              flex: 1,
              minHeight: 44, // touch target mínimo (WCAG 2.5.5)
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
              color: isActive ? primary[500] : surface[500],
              transition: 'color 0.15s ease',
              '&:focus-visible': {
                outline: `2px solid ${primary[500]}`,
                outlineOffset: '-2px',
              },
            }}
          >
            {/* Icon wrapper com badge posicionado */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon sx={{ fontSize: 22, color: 'inherit' }} />
              {showBadge && (
                <Box
                  aria-label={`${unreadCoachMessages} mensagens não lidas`}
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: semantic.danger[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: surface[0],
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {unreadCoachMessages > 9 ? '9+' : unreadCoachMessages}
                </Box>
              )}
            </Box>

            {/* Label */}
            <Box
              component="span"
              sx={{
                fontSize: '0.625rem',
                fontWeight: isActive ? 600 : 400,
                color: 'inherit',
                lineHeight: 1.2,
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default AthleteBottomNav;
