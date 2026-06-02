import { Box, Chip, Typography } from '@mui/material';
import { Cancel, CheckCircle, Edit } from '@mui/icons-material';
import { primary, semantic, surface } from '../../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────────

export type AdjustmentAction = 'approved' | 'modified' | 'rejected';

export interface PlanAdjustmentCardProps {
  adjustmentId: string;
  summary: string;
  action: AdjustmentAction;
  sentAt: Date;
  onViewPlan?: () => void;
}

// ── Action config ──────────────────────────────────────────────────────────

interface ActionConfig {
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
}

function getActionConfig(action: AdjustmentAction): ActionConfig {
  switch (action) {
    case 'approved':
      return {
        icon: <CheckCircle sx={{ fontSize: '1.1rem', color: semantic.success[500] }} />,
        color: semantic.success[500],
        bg: `${semantic.success[500]}0D`,
        label: 'Aprovado',
      };
    case 'modified':
      return {
        icon: <Edit sx={{ fontSize: '1.1rem', color: primary[500] }} />,
        color: primary[500],
        bg: `${primary[500]}0D`,
        label: 'Modificado',
      };
    case 'rejected':
      return {
        icon: <Cancel sx={{ fontSize: '1.1rem', color: semantic.danger[500] }} />,
        color: semantic.danger[500],
        bg: `${semantic.danger[500]}0D`,
        label: 'Rejeitado',
      };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'agora';
  if (diffMin === 1) return 'há 1 minuto';
  if (diffMin < 60) return `há ${diffMin} minutos`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour === 1) return 'há 1 hora';
  if (diffHour < 24) return `há ${diffHour} horas`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'há 1 dia';
  return `há ${diffDay} dias`;
}

// ── Main component ─────────────────────────────────────────────────────────

export function PlanAdjustmentCard({
  summary,
  action,
  sentAt,
  onViewPlan,
}: PlanAdjustmentCardProps) {
  const cfg = getActionConfig(action);

  return (
    <Box
      sx={{
        bgcolor: cfg.bg,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {cfg.icon}

        <Typography
          sx={{
            color: surface[50],
            fontSize: '0.85rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          Ajuste de plano
        </Typography>

        {/* Action badge */}
        <Chip
          label={cfg.label}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.color}`,
            borderRadius: '999px',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </Box>

      {/* Summary */}
      <Typography
        sx={{
          color: surface[300],
          fontSize: '0.85rem',
          lineHeight: 1.4,
          fontStyle: 'italic',
        }}
      >
        &ldquo;{summary}&rdquo;
      </Typography>

      {/* Footer row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 0.25,
        }}
      >
        {/* Ver plano link */}
        {onViewPlan ? (
          <Box
            component="button"
            onClick={onViewPlan}
            sx={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: cfg.color,
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              '&:hover': { opacity: 0.8 },
            }}
          >
            Ver plano →
          </Box>
        ) : (
          <Box />
        )}

        {/* Relative timestamp */}
        <Typography
          sx={{
            color: surface[500],
            fontSize: '0.7rem',
            ml: 'auto',
          }}
        >
          {formatRelativeTime(sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

export default PlanAdjustmentCard;
