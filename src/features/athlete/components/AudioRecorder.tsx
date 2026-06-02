import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Mic, Pause, PlayArrow, Stop } from '@mui/icons-material';
import { elevation } from '../../../shared/design-tokens';
import { primary, semantic, surface } from '../../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationMs: number) => void;
  onCancel: () => void;
  maxDurationMs?: number;
}

type RecorderState = 'idle' | 'recording' | 'preview' | 'error';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── Main component ─────────────────────────────────────────────────────────

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  maxDurationMs = 60_000,
}: AudioRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const recordedBlobRef = useRef<Blob | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (recorderState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next * 1000 >= maxDurationMs) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState, maxDurationMs]);

  // ── Start recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!window.MediaRecorder) {
      setErrorMessage('Gravação de áudio não é suportada neste navegador.');
      setRecorderState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recordedBlobRef.current = blob;

        // Build preview audio element
        const url = URL.createObjectURL(blob);
        previewAudioRef.current = new Audio(url);
        previewAudioRef.current.onended = () => setPreviewPlaying(false);

        setRecorderState('preview');

        // Stop mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      startTimeRef.current = Date.now();
      setElapsed(0);
      recorder.start();
      setRecorderState('recording');
    } catch {
      setErrorMessage('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      setRecorderState('error');
    }
  }, []);

  // ── Stop recording ───────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Send recording ───────────────────────────────────────────────────────
  const sendRecording = useCallback(() => {
    if (!recordedBlobRef.current) return;
    const durationMs = elapsed * 1000;
    onRecordingComplete(recordedBlobRef.current, durationMs);
  }, [elapsed, onRecordingComplete]);

  // ── Preview play/pause ───────────────────────────────────────────────────
  const togglePreview = useCallback(() => {
    if (!previewAudioRef.current) return;
    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      void previewAudioRef.current.play();
      setPreviewPlaying(true);
    }
  }, [previewPlaying]);

  // ── Cancel (any state) ───────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    recordedBlobRef.current = null;
    setElapsed(0);
    setRecorderState('idle');
    onCancel();
  }, [onCancel]);

  // ── Render: error ────────────────────────────────────────────────────────
  if (recorderState === 'error') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 2 }}>
        <Typography sx={{ color: semantic.danger[500], fontSize: '0.875rem', textAlign: 'center' }}>
          {errorMessage}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={handleCancel}
          sx={{ color: surface[400], borderColor: surface[600] }}
        >
          Fechar
        </Button>
      </Box>
    );
  }

  // ── Render: idle ─────────────────────────────────────────────────────────
  if (recorderState === 'idle') {
    return (
      <Box
        component="button"
        onClick={() => void startRecording()}
        aria-label="Iniciar gravação"
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: elevation.card,
          border: `1px solid ${surface[700]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
          '&:hover': { opacity: 0.8 },
        }}
      >
        <Mic sx={{ color: primary[500], fontSize: '1.5rem' }} />
      </Box>
    );
  }

  // ── Render: recording ────────────────────────────────────────────────────
  if (recorderState === 'recording') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="button"
          onClick={stopRecording}
          aria-label="Parar gravação"
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: `${semantic.danger[500]}26`,
            border: `1px solid ${semantic.danger[500]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%':   { boxShadow: `0 0 0 0 ${semantic.danger[500]}66` },
              '70%':  { boxShadow: `0 0 0 10px ${semantic.danger[500]}00` },
              '100%': { boxShadow: `0 0 0 0 ${semantic.danger[500]}00` },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
        >
          <Stop sx={{ color: semantic.danger[500], fontSize: '1.5rem' }} />
        </Box>

        <Typography sx={{ color: semantic.danger[500], fontSize: '0.9rem', fontWeight: 600, minWidth: 40 }}>
          {formatElapsed(elapsed)}
        </Typography>

        <Typography sx={{ color: surface[500], fontSize: '0.75rem' }}>
          / {formatElapsed(Math.floor(maxDurationMs / 1000))}
        </Typography>
      </Box>
    );
  }

  // ── Render: preview ──────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <IconButton
        onClick={togglePreview}
        size="small"
        aria-label={previewPlaying ? 'Pausar prévia' : 'Ouvir gravação'}
        sx={{
          width: 40,
          height: 40,
          bgcolor: elevation.card,
          border: `1px solid ${surface[700]}`,
          '&:hover': { bgcolor: elevation.highest },
        }}
      >
        {previewPlaying
          ? <Pause sx={{ color: surface[50], fontSize: '1.2rem' }} />
          : <PlayArrow sx={{ color: surface[50], fontSize: '1.2rem' }} />
        }
      </IconButton>

      <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>
        {formatElapsed(elapsed)}
      </Typography>

      <Button
        size="small"
        variant="contained"
        onClick={sendRecording}
        sx={{
          bgcolor: primary[500],
          color: surface[900],
          fontWeight: 700,
          fontSize: '0.8rem',
          '&:hover': { bgcolor: primary[400] },
        }}
      >
        Enviar
      </Button>

      <Button
        size="small"
        variant="text"
        onClick={handleCancel}
        sx={{
          color: surface[400],
          fontSize: '0.8rem',
          '&:hover': { color: surface[50] },
        }}
      >
        Cancelar
      </Button>
    </Box>
  );
}

export default AudioRecorder;
