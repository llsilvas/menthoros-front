import { useState } from 'react';
import { Avatar, Box, Collapse, IconButton, LinearProgress, Typography } from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { content } from '../../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────────

interface BaseMessage {
  id: string;
  from: 'athlete' | 'coach';
  sentAt: Date;
}

interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
}

interface AudioMessage extends BaseMessage {
  type: 'audio';
  audioUrl: string;
  transcription: string;
  durationMs: number;
}

export type Message = TextMessage | AudioMessage;

export interface MessageBubbleProps {
  message: Message;
  coachName?: string;
  coachAvatarUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface TextBubbleBodyProps {
  message: TextMessage;
}

function TextBubbleBody({ message }: TextBubbleBodyProps) {
  return (
    <Typography
      sx={{
        color: surface[50],
        fontSize: '0.9rem',
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}
    >
      {message.content}
    </Typography>
  );
}

interface AudioBubbleBodyProps {
  message: AudioMessage;
}

function AudioBubbleBody({ message }: AudioBubbleBodyProps) {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const durationSec = Math.ceil(message.durationMs / 1000);

  return (
    <Box>
      {/* Player row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => setPlaying((prev) => !prev)}
          sx={{ color: surface[50], p: 0.5 }}
          aria-label={playing ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
        </IconButton>

        {/* Simulated progress bar */}
        <LinearProgress
          variant="determinate"
          value={playing ? 40 : 0}
          sx={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            bgcolor: `${surface[0]}26`,
            '& .MuiLinearProgress-bar': {
              bgcolor: surface[50],
              borderRadius: 2,
            },
          }}
        />

        <Typography sx={{ color: surface[400], fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {durationSec}s
        </Typography>
      </Box>

      {/* Expandable transcription */}
      <Box
        component="button"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          mt: 0.75,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: surface[400],
        }}
        aria-expanded={expanded}
        aria-label="Mostrar transcrição"
      >
        <Typography sx={{ fontSize: '0.75rem' }}>Transcrição</Typography>
        {expanded ? <ExpandLess sx={{ fontSize: '0.9rem' }} /> : <ExpandMore sx={{ fontSize: '0.9rem' }} />}
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Typography
          sx={{
            mt: 0.5,
            color: surface[400],
            fontSize: '0.8rem',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {message.transcription}
        </Typography>
      </Collapse>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function MessageBubble({ message, coachName, coachAvatarUrl }: MessageBubbleProps) {
  const isCoach = message.from === 'coach';

  const bubbleSx = isCoach
    ? {
        bgcolor: elevation.card,
        border: `1px solid ${content.cardBorder}`,
        borderRadius: 2,
      }
    : {
        bgcolor: `${primary[500]}1A`,
        border: `1px solid ${primary[500]}33`,
        borderRadius: '16px 16px 4px 16px',
      };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isCoach ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: 1,
        width: '100%',
      }}
    >
      {/* Coach avatar */}
      {isCoach && (
        <Avatar
          src={coachAvatarUrl}
          alt={coachName ?? 'Coach'}
          sx={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}
        >
          {!coachAvatarUrl && getInitials(coachName ?? 'Coach')}
        </Avatar>
      )}

      {/* Bubble */}
      <Box
        sx={{
          maxWidth: '75%',
          p: 1.5,
          ...bubbleSx,
        }}
      >
        {/* Coach name header */}
        {isCoach && coachName && (
          <Typography
            sx={{
              color: primary[500],
              fontSize: '0.75rem',
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            {coachName}
          </Typography>
        )}

        {/* Message body */}
        {message.type === 'text' ? (
          <TextBubbleBody message={message} />
        ) : (
          <AudioBubbleBody message={message} />
        )}

        {/* Timestamp */}
        <Typography
          sx={{
            color: surface[500],
            fontSize: '0.7rem',
            mt: 0.5,
            textAlign: isCoach ? 'left' : 'right',
          }}
        >
          {formatTimestamp(message.sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

export default MessageBubble;
