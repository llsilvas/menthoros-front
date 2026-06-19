import { useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAttentionQueue } from '../../../hooks/useAttentionQueue';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { elevation } from '../../../shared/design-tokens';
import { content, semantic, surface } from '../../../theme/tokens';
import type { AttentionSeverity, CoachAttentionItem } from '../../../types/Coach';

// ── Helpers ───────────────────────────────────────────────────────────────────

const REASON_LABEL: Record<string, string> = {
  FADIGA: 'Fadiga',
  SOBRECARGA: 'Sobrecarga',
  SEM_PLANO: 'Sem plano',
  ADERENCIA: 'Aderência',
  INATIVIDADE: 'Inatividade',
  ZONAS_VENCIDAS: 'Zonas vencidas',
};

function severityColor(severity: AttentionSeverity): string {
  return severity === 'CRITICA' ? semantic.danger[500] : semantic.warning[500];
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SeverityChip({ severity }: { severity: AttentionSeverity }) {
  const color = severityColor(severity);
  const label = severity === 'CRITICA' ? 'Crítica' : 'Alta';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 0.75,
        py: 0.25,
        borderRadius: '4px',
        border: `1px solid ${color}`,
        bgcolor: `${color}1A`,
        color,
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
}

function AttentionQueueItem({ item }: { item: CoachAttentionItem }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        borderRadius: '8px',
        border: `1px solid ${content.cardBorder}`,
        bgcolor: elevation.card,
      }}
    >
      {/* Linha 1: avatar + nome + chip de severidade */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CoachAthleteAvatar
          athlete={{ id: item.atletaId, name: item.athleteName }}
          size="sm"
          status="none"
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: surface[50],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.athleteName}
            </Typography>
            <SeverityChip severity={item.severity} />
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: surface[400],
                fontWeight: 500,
              }}
            >
              {REASON_LABEL[item.primaryReason] ?? item.primaryReason}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Linha 2: ação sugerida */}
      <Typography sx={{ fontSize: '0.8rem', color: surface[200], lineHeight: 1.5 }}>
        {item.suggestedAction}
      </Typography>

      {/* Linha 3: rationale (se presente) */}
      {item.explanation?.rationale && (
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: surface[500],
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}
        >
          {item.explanation.rationale}
        </Typography>
      )}

      {/* Linha 4: evidências */}
      {item.evidence.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {item.evidence.map((e) => (
            <Box
              key={e.label}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
                bgcolor: `${surface[0]}0F`,
                border: `1px solid ${content.cardBorder}`,
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: surface[400] }}>
                {e.label}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: surface[300] }}>
                {e.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        px: 3,
      }}
    >
      <CheckCircleIcon sx={{ fontSize: 56, color: semantic.success[500] }} />
      <Typography
        sx={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: surface[50],
          fontFamily: 'Syne, sans-serif',
        }}
      >
        Todos os atletas em dia!
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: surface[400], textAlign: 'center' }}>
        Nenhum atleta requer atenção no momento.
      </Typography>
    </Box>
  );
}

// ── Page principal ────────────────────────────────────────────────────────────

export default function CoachAttentionQueuePage() {
  const { queue, loading, error, fetchQueue } = useAttentionQueue();

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: semantic.danger[500], fontSize: '0.875rem' }}>
          Não foi possível carregar a fila de atenção. Tente novamente.
        </Typography>
      </Box>
    );
  }

  if (queue.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', height: '100%' }}>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: surface[400],
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 0.5,
        }}
      >
        {queue.length} {queue.length === 1 ? 'atleta' : 'atletas'} em atenção
      </Typography>

      {queue.map((item) => (
        <AttentionQueueItem key={item.atletaId} item={item} />
      ))}
    </Box>
  );
}
