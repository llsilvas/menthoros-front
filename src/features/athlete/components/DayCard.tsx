import * as React from 'react';
import { Box, Typography } from '@mui/material';
import {
  DirectionsRun as RunIcon,
  FitnessCenter as StrengthIcon,
  Pool as CrosstrainIcon,
  Favorite as RestIcon,
  Bedtime as MoonIcon,
  CheckCircle as CheckIcon,
  RemoveCircleOutline as SkippedIcon,
} from '@mui/icons-material';
import { primary, surface, semantic, categorical } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkoutType =
  | 'easy_run'
  | 'long_run'
  | 'tempo'
  | 'intervals'
  | 'recovery'
  | 'rest'
  | 'strength'
  | 'crosstrain';

export type CompletionStatus = 'pending' | 'completed' | 'skipped' | 'modified';

export interface DayCardWorkout {
  type: WorkoutType;
  title: string;
  description: string;
  estimatedTSS: number;
  durationMinutes: number;
}

export interface DayCardProps {
  date: Date;
  isToday: boolean;
  isFuture: boolean;
  workout: DayCardWorkout | null; // null = descanso
  completionStatus: CompletionStatus;
  onPress: (date: Date) => void;
  /** Ref exposto para auto-scroll pelo WeeklyPlanList */
  cardRef?: React.Ref<HTMLDivElement>;
}

// ── Workout type colors (categorical — não colidem com semântica) ─────────────

const TYPE_COLORS: Record<WorkoutType, string> = {
  easy_run:   categorical.cat1,
  long_run:   categorical.cat7,
  tempo:      categorical.cat3,
  intervals:  categorical.cat5,
  recovery:   categorical.cat6,
  rest:       categorical.cat8,
  strength:   categorical.cat4,
  crosstrain: categorical.cat2,
};

// ── Workout type icons ─────────────────────────────────────────────────────────

function WorkoutIcon({ type }: { type: WorkoutType }) {
  const color = TYPE_COLORS[type];
  const iconSx = { fontSize: 18, color };

  switch (type) {
    case 'strength':
      return <StrengthIcon sx={iconSx} />;
    case 'crosstrain':
      return <CrosstrainIcon sx={iconSx} />;
    case 'rest':
    case 'recovery':
      return <RestIcon sx={iconSx} />;
    default:
      return <RunIcon sx={iconSx} />;
  }
}

// ── Rest day display ───────────────────────────────────────────────────────────

function RestDisplay() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
      <MoonIcon sx={{ fontSize: 18, color: surface[400] }} />
      <Typography sx={{ fontSize: '0.85rem', color: surface[400], fontWeight: 500 }}>
        Descanso
      </Typography>
    </Box>
  );
}

// ── Completion indicator ───────────────────────────────────────────────────────

function CompletionIndicator({ status }: { status: CompletionStatus }) {
  if (status === 'completed') {
    return <CheckIcon sx={{ fontSize: 16, color: semantic.success[500] }} />;
  }
  if (status === 'skipped') {
    return <SkippedIcon sx={{ fontSize: 16, color: surface[600] }} />;
  }
  return null;
}

// ── Border left color logic ────────────────────────────────────────────────────

function getBorderLeft(
  isToday: boolean,
  isFuture: boolean,
  completionStatus: CompletionStatus,
): string {
  if (isToday) return `4px solid ${primary[500]}`;
  if (isFuture) return `4px solid transparent`;
  if (completionStatus === 'completed') return `4px solid ${semantic.success[500]}`;
  if (completionStatus === 'skipped') return `4px solid ${surface[600]}`;
  return `4px solid transparent`;
}

// ── Background logic ───────────────────────────────────────────────────────────

function getBackground(isToday: boolean): string {
  if (isToday) return `${primary[500]}0A`;
  return elevation.card;
}

// ── DayCard ───────────────────────────────────────────────────────────────────

export function DayCard({
  date,
  isToday,
  isFuture,
  workout,
  completionStatus,
  onPress,
  cardRef,
}: DayCardProps) {
  const dayLabel = date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
  });

  const borderLeft = getBorderLeft(isToday, isFuture, completionStatus);
  const background = getBackground(isToday);

  const handleClick = React.useCallback(() => {
    onPress(date);
  }, [date, onPress]);

  return (
    <Box
      ref={cardRef}
      onClick={handleClick}
      sx={{
        minWidth: '160px',
        maxWidth: '200px',
        height: '100%',
        background,
        borderLeft,
        borderRadius: '8px',
        border: `1px solid ${surface[700]}`,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: borderLeft.split(' ')[2] ?? 'transparent',
        // Reaplica border compacto corretamente
        outline: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '8px',
        transition: 'background 0.15s ease',
        '&:hover': {
          background: isToday
            ? `${primary[500]}14`
            : `${surface[800]}`,
        },
      }}
    >
      {/* Header: dia e badge HOJE */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: isToday ? primary[500] : surface[300],
            textTransform: 'capitalize',
          }}
        >
          {dayLabel}
        </Typography>

        {isToday && (
          <Box
            sx={{
              bgcolor: primary[500],
              color: surface[900],
              fontSize: '0.65rem',
              fontWeight: 800,
              lineHeight: 1,
              px: '5px',
              py: '2px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
            }}
          >
            HOJE
          </Box>
        )}
      </Box>

      {/* Divisor */}
      <Box sx={{ height: '1px', bgcolor: surface[700] }} />

      {/* Conteúdo do treino */}
      <Box sx={{ flex: 1, opacity: isFuture ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {workout === null ? (
          <RestDisplay />
        ) : (
          <>
            {/* Tipo + ícone + status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <WorkoutIcon type={workout.type} />
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: surface[50],
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {workout.title}
              </Typography>
              {!isFuture && <CompletionIndicator status={completionStatus} />}
            </Box>

            {/* Duração */}
            <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>
              {workout.durationMinutes} min
            </Typography>

            {/* TSS estimado */}
            <Typography sx={{ fontSize: '0.72rem', color: surface[500] }}>
              TSS estimado: {workout.estimatedTSS}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

export default DayCard;
