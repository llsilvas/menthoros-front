import { Box, Button, Typography } from '@mui/material';
import { workoutGradients, timeOfDayOverlay } from '../../../shared/design-tokens/gradients';
import type { WorkoutType, TimeOfDay } from '../../../shared/design-tokens/gradients';
import { primary, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';
import { elevation } from '../../../shared/design-tokens';

export type { WorkoutType, TimeOfDay };

export interface TodayHeroCardProps {
  athleteName: string;
  workoutType: WorkoutType;
  timeOfDay: TimeOfDay;
  greeting?: string;
  motivationalMessage: string;
  nextWorkout: {
    title: string;
    description: string;
    estimatedDuration?: number; // minutos; ausente quando o resumo do dia não traz duração
  } | null;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
}

function buildGreeting(timeOfDay: TimeOfDay, athleteName: string, greeting?: string): string {
  if (greeting) return greeting;
  const greetingByTime: Record<TimeOfDay, string> = {
    morning:   'Bom dia',
    afternoon: 'Boa tarde',
    evening:   'Boa noite',
    night:     'Boa noite',
  };
  return `${greetingByTime[timeOfDay]}, ${athleteName}`;
}

export function TodayHeroCard({
  athleteName,
  workoutType,
  timeOfDay,
  greeting,
  motivationalMessage,
  nextWorkout,
  onPrimaryAction,
  primaryActionLabel,
}: TodayHeroCardProps) {
  const greetingText = buildGreeting(timeOfDay, athleteName, greeting);

  return (
    <Box
      sx={{
        borderRadius: 2,
        p: 3,
        background: workoutGradients[workoutType],
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Overlay por período do dia */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: timeOfDayOverlay[timeOfDay],
          pointerEvents: 'none',
        }}
      />

      {/* Saudação */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            color: surface[50],
            fontSize: '0.9rem',
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          {greetingText}
        </Typography>

        <Typography
          sx={{
            color: surface[50],
            fontSize: '1.1rem',
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          &ldquo;{motivationalMessage}&rdquo;
        </Typography>
      </Box>

      {/* Sub-card do próximo treino */}
      {nextWorkout !== null && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            bgcolor: overlayWhite[8],
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography
            sx={{
              color: surface[50],
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              mb: 0.25,
            }}
          >
            Próximo
          </Typography>
          <Typography
            sx={{
              color: surface[50],
              fontSize: '0.95rem',
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {nextWorkout.title}
          </Typography>
          <Typography
            sx={{
              color: surface[200],
              fontSize: '0.82rem',
              mt: 0.25,
            }}
          >
            {nextWorkout.description}
            {nextWorkout.estimatedDuration != null && ` · ${nextWorkout.estimatedDuration} min`}
          </Typography>
        </Box>
      )}

      {/* CTA */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onPrimaryAction}
          sx={{
            bgcolor: primary[500],
            color: elevation.base,
            fontWeight: 700,
            '&:hover': {
              bgcolor: primary[400],
            },
          }}
        >
          {primaryActionLabel}
        </Button>
      </Box>
    </Box>
  );
}

export default TodayHeroCard;
