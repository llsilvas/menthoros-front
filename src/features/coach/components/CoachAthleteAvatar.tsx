import { Avatar, Box } from '@mui/material';
import { semantic, surface } from '../../../shared/design-tokens';

export type AvatarStatusDot =
  | 'pending_validation'
  | 'alert'
  | 'warning'
  | 'synced'
  | 'no_sync'
  | 'none';

export interface CoachAthleteAvatarProps {
  athlete: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: AvatarStatusDot;
  showInitialsFallback?: boolean;
  onClick?: () => void;
}

const sizePx: Record<NonNullable<CoachAthleteAvatarProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const statusColor: Record<Exclude<AvatarStatusDot, 'none'>, string> = {
  pending_validation: semantic.warning[500],
  alert:              semantic.danger[500],
  warning:            semantic.warning[400],
  synced:             semantic.success[500],
  no_sync:            surface[400],
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const parts = words.slice(0, 2);
  return parts.map((w) => w[0].toUpperCase()).join('');
}

export function CoachAthleteAvatar({
  athlete,
  size = 'md',
  status = 'none',
  showInitialsFallback = true,
  onClick,
}: CoachAthleteAvatarProps) {
  const diameter = sizePx[size];
  const dotDiameter = Math.round(diameter * 0.3);

  const hasStatus = status !== 'none';
  const dotColor = hasStatus ? statusColor[status] : undefined;

  const initials = showInitialsFallback ? getInitials(athlete.name) : undefined;

  return (
    <Box
      sx={{
        position:  'relative',
        display:   'inline-flex',
        flexShrink: 0,
        cursor:    onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={athlete.name}
    >
      <Avatar
        src={athlete.avatarUrl}
        alt={athlete.name}
        sx={{
          width:      diameter,
          height:     diameter,
          // Piso de 11px: as iniciais são texto e seguem a mesma regra do resto do shell — em
          // avatares pequenos, 0.38 do diâmetro dava 9px.
          fontSize:   Math.max(11, diameter * 0.38),
          fontWeight: 600,
          bgcolor:    surface[700],
          color:      surface[50],
        }}
      >
        {!athlete.avatarUrl && initials}
      </Avatar>

      {hasStatus && dotColor && (
        <Box
          sx={{
            position:        'absolute',
            bottom:          0,
            right:           0,
            width:           dotDiameter,
            height:          dotDiameter,
            borderRadius:    '50%',
            backgroundColor: dotColor,
            border:          `2px solid ${surface[900]}`,
            boxSizing:       'border-box',
          }}
          aria-hidden="true"
        />
      )}
    </Box>
  );
}

export default CoachAthleteAvatar;
