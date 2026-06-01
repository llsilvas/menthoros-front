import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Message types (compatível com MessageBubble.tsx do agente paralelo) ─────
type MessageFrom = 'athlete' | 'coach';

interface TextMessage {
  id: string;
  type: 'text';
  from: MessageFrom;
  content: string;
  sentAt: Date;
}

interface AudioMessage {
  id: string;
  type: 'audio';
  from: MessageFrom;
  audioUrl: string;
  transcription: string;
  durationMs: number;
  sentAt: Date;
}

interface PlanAdjustmentMessage {
  id: string;
  type: 'plan_adjustment';
  from: 'coach';
  adjustmentId: string;
  summary: string;
  action: 'approved' | 'modified' | 'rejected';
  sentAt: Date;
}

type ConversationMessage = TextMessage | AudioMessage | PlanAdjustmentMessage;

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_MESSAGES: ConversationMessage[] = [
  {
    id: '1',
    type: 'text',
    from: 'coach',
    content: 'Bom dia! Vi que ontem você completou o longão em ótimo ritmo. Como está a recuperação?',
    sentAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    type: 'text',
    from: 'athlete',
    content: 'Oi Coach! Estou bem, pernas um pouco pesadas mas nada preocupante.',
    sentAt: new Date(Date.now() - 3000000),
  },
  {
    id: '3',
    type: 'plan_adjustment',
    from: 'coach',
    adjustmentId: 'adj-1',
    summary: 'Reduzindo volume de terça para 8km — priorizando recuperação',
    action: 'approved',
    sentAt: new Date(Date.now() - 1800000),
  },
  {
    id: '4',
    type: 'text',
    from: 'coach',
    content: 'Ajustei o treino de terça. Foco em recuperação agora para o longão de sábado.',
    sentAt: new Date(Date.now() - 1800000),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  const totalSecs = Math.round(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getPlanActionColor(action: PlanAdjustmentMessage['action']): string {
  switch (action) {
    case 'approved':
      return semantic.success[500];
    case 'modified':
      return semantic.warning[500];
    case 'rejected':
      return semantic.danger[500];
  }
}

function getPlanActionLabel(action: PlanAdjustmentMessage['action']): string {
  switch (action) {
    case 'approved':
      return 'Aprovado';
    case 'modified':
      return 'Modificado';
    case 'rejected':
      return 'Rejeitado';
  }
}

function getPlanActionIcon(action: PlanAdjustmentMessage['action']): React.ReactNode {
  const color = getPlanActionColor(action);
  switch (action) {
    case 'approved':
      return <CheckCircleIcon sx={{ fontSize: 16, color }} />;
    case 'modified':
      return <EditIcon sx={{ fontSize: 16, color }} />;
    case 'rejected':
      return <CancelIcon sx={{ fontSize: 16, color }} />;
  }
}

// ── Sub-renderers (inline — TODO: substituir por componentes externos) ────────

function renderTextBubble(msg: TextMessage) {
  const isAthlete = msg.from === 'athlete';
  return (
    <Box
      key={msg.id}
      sx={{
        display: 'flex',
        justifyContent: isAthlete ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      {/* TODO: substituir por <MessageBubble message={msg} /> */}
      <Box
        sx={{
          maxWidth: '75%',
          p: 1.5,
          borderRadius: isAthlete ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          bgcolor: isAthlete ? `${primary[500]}1A` : elevation.card,
          border: `1px solid ${isAthlete ? `${primary[500]}33` : content.cardBorder}`,
        }}
      >
        <Typography sx={{ color: surface[50], fontSize: '0.9rem', lineHeight: 1.5 }}>
          {msg.content}
        </Typography>
        <Typography sx={{ color: surface[500], fontSize: '0.7rem', mt: 0.5, textAlign: 'right' }}>
          {formatTime(msg.sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

function renderAudioBubble(msg: AudioMessage) {
  const isAthlete = msg.from === 'athlete';
  return (
    <Box
      key={msg.id}
      sx={{
        display: 'flex',
        justifyContent: isAthlete ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      {/* TODO: substituir por <MessageBubble message={msg} /> */}
      <Box
        sx={{
          maxWidth: '75%',
          p: 1.5,
          borderRadius: isAthlete ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          bgcolor: isAthlete ? `${primary[500]}1A` : elevation.card,
          border: `1px solid ${isAthlete ? `${primary[500]}33` : content.cardBorder}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" sx={{ color: primary[500], p: 0.5 }}>
            <PlayArrowIcon fontSize="small" />
          </IconButton>
          <Box
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              bgcolor: `${primary[500]}33`,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '0%',
                borderRadius: 2,
                bgcolor: primary[500],
              }}
            />
          </Box>
          <Typography sx={{ color: surface[400], fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            {formatDuration(msg.durationMs)}
          </Typography>
        </Box>
        {msg.transcription && (
          <Typography
            sx={{
              color: surface[400],
              fontSize: '0.78rem',
              mt: 1,
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            {msg.transcription}
          </Typography>
        )}
        <Typography sx={{ color: surface[500], fontSize: '0.7rem', mt: 0.5, textAlign: 'right' }}>
          {formatTime(msg.sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

function renderPlanAdjustmentCard(msg: PlanAdjustmentMessage) {
  const actionColor = getPlanActionColor(msg.action);
  const actionLabel = getPlanActionLabel(msg.action);
  const actionIcon = getPlanActionIcon(msg.action);

  return (
    <Box key={msg.id} sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
      {/* TODO: substituir por <PlanAdjustmentCard message={msg} /> */}
      <Box
        sx={{
          maxWidth: '85%',
          p: 1.5,
          borderRadius: 2,
          bgcolor: elevation.card,
          border: `1px solid ${actionColor}33`,
          borderLeft: `3px solid ${actionColor}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          {actionIcon}
          <Typography
            sx={{
              color: actionColor,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Ajuste de Plano · {actionLabel}
          </Typography>
        </Box>
        <Typography sx={{ color: surface[50], fontSize: '0.88rem', lineHeight: 1.5 }}>
          {msg.summary}
        </Typography>
        <Typography sx={{ color: surface[500], fontSize: '0.7rem', mt: 0.5 }}>
          {formatTime(msg.sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

function renderMessage(msg: ConversationMessage) {
  switch (msg.type) {
    case 'text':
      return renderTextBubble(msg);
    case 'audio':
      return renderAudioBubble(msg);
    case 'plan_adjustment':
      return renderPlanAdjustmentCard(msg);
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CoachInfo {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface CoachChatPanelProps {
  athleteId: string;
  coach: CoachInfo;
  messages: ConversationMessage[];
  coachIsTyping?: boolean;
  onSendText: (text: string) => Promise<void>;
  onSendAudio: (blob: Blob, durationMs: number) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CoachChatPanel({
  coach,
  messages,
  coachIsTyping = false,
  onSendText,
  onSendAudio: _onSendAudio,
}: CoachChatPanelProps) {
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Combina mensagens externas com mock (mock como fallback quando lista vazia)
  const displayMessages: ConversationMessage[] =
    messages.length > 0 ? messages : MOCK_MESSAGES;

  // Auto-scroll ao fundo quando mensagens mudam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, coachIsTyping]);

  async function handleSendText() {
    const trimmed = textInput.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await onSendText(trimmed);
      setTextInput('');
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendText();
    }
  }

  function handleToggleRecording() {
    if (isRecording) {
      // TODO: parar MediaRecorder real e chamar onSendAudio com o blob gravado
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: elevation.base,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${content.cardBorder}`,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          bgcolor: elevation.panel,
          borderBottom: `1px solid ${content.cardBorder}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: `${primary[500]}26`,
              color: primary[500],
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {getInitials(coach.name)}
          </Avatar>
          {/* Dot online/offline */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: coach.isOnline ? semantic.success[500] : surface[600],
              border: `2px solid ${elevation.panel}`,
            }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              color: surface[50],
              fontWeight: 600,
              fontSize: '0.95rem',
              lineHeight: 1.2,
            }}
          >
            {coach.name}
          </Typography>
          <Typography
            sx={{
              color: coach.isOnline ? semantic.success[500] : surface[500],
              fontSize: '0.75rem',
            }}
          >
            {coach.isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>

      {/* ── Área de mensagens ────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          // Scrollbar sutil
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: `${surface[600]}80`,
            borderRadius: 2,
          },
        }}
      >
        {displayMessages.map(renderMessage)}

        {/* Indicador "Coach está digitando..." */}
        {coachIsTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '16px 16px 16px 4px',
                bgcolor: elevation.card,
                border: `1px solid ${content.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={10} sx={{ color: surface[400] }} />
              <Typography sx={{ color: surface[400], fontSize: '0.82rem', fontStyle: 'italic' }}>
                Coach está digitando...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Sentinel para auto-scroll */}
        <div ref={bottomRef} />
      </Box>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: elevation.panel,
          borderTop: `1px solid ${content.cardBorder}`,
          flexShrink: 0,
        }}
      >
        {/* Placeholder de gravação */}
        {isRecording && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              bgcolor: `${semantic.danger[500]}1A`,
              border: `1px solid ${semantic.danger[500]}33`,
            }}
          >
            {/* TODO: substituir por <AudioRecorder onStop={...} /> */}
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: semantic.danger[500],
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Typography sx={{ color: semantic.danger[300], fontSize: '0.85rem', flex: 1 }}>
              Gravando áudio...
            </Typography>
            <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>
              Toque em parar para enviar
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {/* Botão mic / stop */}
          <IconButton
            onClick={handleToggleRecording}
            size="small"
            sx={{
              color: isRecording ? semantic.danger[500] : surface[400],
              '&:hover': { color: isRecording ? semantic.danger[300] : surface[50] },
              flexShrink: 0,
              mb: 0.5,
            }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>

          {/* Campo de texto */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Escreva uma mensagem..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRecording || isSending}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: content.inputBg,
                borderRadius: 2,
                color: surface[50],
                fontSize: '0.9rem',
                '& fieldset': { borderColor: content.inputBorder },
                '&:hover fieldset': { borderColor: content.inputBorderFocus },
                '&.Mui-focused fieldset': { borderColor: primary[500] },
              },
              '& .MuiInputBase-input::placeholder': {
                color: surface[500],
                opacity: 1,
              },
            }}
          />

          {/* Botão enviar */}
          <IconButton
            onClick={() => void handleSendText()}
            disabled={!textInput.trim() || isSending || isRecording}
            size="small"
            sx={{
              color: textInput.trim() && !isSending && !isRecording
                ? primary[500]
                : surface[600],
              transition: 'color 0.15s ease',
              '&:hover': {
                color: textInput.trim() ? primary[400] : surface[600],
              },
              flexShrink: 0,
              mb: 0.5,
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default CoachChatPanel;
