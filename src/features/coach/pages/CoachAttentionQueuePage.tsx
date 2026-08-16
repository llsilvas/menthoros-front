import { Button, Box, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useOutletContext } from 'react-router';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { elevation } from '../../../shared/design-tokens';
import { content, semantic, surface } from '../../../theme/tokens';
import type { AttentionReason, AttentionSeverity, CoachAttentionItem } from '../../../types/Coach';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AttentionSeverity, { color: string; label: string }> = {
  CRITICA: { color: semantic.danger[500],  label: 'Crítica' },
  ALTA:    { color: semantic.warning[500], label: 'Alta'    },
  MEDIA:   { color: semantic.info[500],    label: 'Média'   },
};

const REASON_LABEL: Record<AttentionReason, string> = {
  FADIGA:        'Fadiga',
  SOBRECARGA:    'Sobrecarga',
  SEM_PLANO:     'Sem plano',
  ADERENCIA:     'Aderência',
  INATIVIDADE:   'Inatividade',
  ZONAS_VENCIDAS:'Zonas vencidas',
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

interface SeverityChipProps {
  severity: AttentionSeverity;
}

function SeverityChip({ severity }: SeverityChipProps) {
  const { color, label } = SEVERITY_CONFIG[severity];
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

interface AttentionQueueItemProps {
  item: CoachAttentionItem;
}

function AttentionQueueItem({ item }: AttentionQueueItemProps) {
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
              {REASON_LABEL[item.primaryReason]}
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

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ color: semantic.danger[500], fontSize: '0.875rem' }}>
        Não foi possível carregar a fila de atenção.
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={onRetry}
        sx={{ alignSelf: 'flex-start', borderColor: semantic.danger[500], color: semantic.danger[500] }}
      >
        Tentar novamente
      </Button>
    </Box>
  );
}

// ── Page principal ────────────────────────────────────────────────────────────

export default function CoachAttentionQueuePage() {
  const { queue, queueLoading: loading, queueError: error, refetchQueue } =
    useOutletContext<CoachLayoutOutletContext>();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return <ErrorState onRetry={refetchQueue} />;
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
