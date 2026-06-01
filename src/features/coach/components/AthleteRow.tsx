import React from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import { semantic, surface } from '../../../shared/design-tokens';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import type { AvatarStatusDot } from './CoachAthleteAvatar';
import { MetricCell } from '../../../shared/components/MetricCell';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';
import { PhaseIndicator } from '../../../shared/components/PhaseIndicator';
import type { TrainingPhase } from '../../../shared/components/PhaseIndicator';

// ── Shared types ──────────────────────────────────────────────────────────────

interface AthleteMetrics {
  ctl: number;
  atl: number;
  tsb: number;
}

export interface AthleteUIModel {
  id: string;
  name: string;
  avatarUrl?: string;
  sport: 'running' | 'cycling' | 'triathlon' | 'swimming';
  phase: TrainingPhase;
  metrics: AthleteMetrics;
  lastActivity?: { date: Date; type: string; distance?: number };
  nextWorkout?: { date: Date; type: string };
  status: StatusBadgeVariant;
  statusDot?: AvatarStatusDot | 'none';
}

export interface TableColumn {
  key: keyof AthleteMetrics | string;
  label: string;
  render?: (athlete: AthleteUIModel) => React.ReactNode;
}

export interface AthleteRowProps {
  athlete: AthleteUIModel;
  variant: 'table' | 'list' | 'calendar';
  columns?: TableColumn[];
  metadata?: React.ReactNode;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves the left-border color and optional background tint for
 * the 'list' variant based on athlete.status.
 */
function getListStatusTokens(status: StatusBadgeVariant): {
  borderColor: string;
  bgColor: string | undefined;
} {
  switch (status) {
    case 'active':
      return {
        borderColor: semantic.success[500],
        bgColor: `${semantic.success[500]}0D`,
      };
    case 'warning':
      return {
        borderColor: semantic.warning[500],
        bgColor: `${semantic.warning[500]}0D`,
      };
    case 'danger':
      return {
        borderColor: semantic.danger[500],
        bgColor: `${semantic.danger[500]}0D`,
      };
    case 'paused':
      return {
        borderColor: surface[700],
        bgColor: undefined,
      };
    case 'inactive':
      return {
        borderColor: surface[600],
        bgColor: undefined,
      };
    case 'pending':
      return {
        borderColor: semantic.info[500],
        bgColor: `${semantic.info[500]}0D`,
      };
  }
}

/**
 * Maps athlete.status to a human-readable badge label.
 * Kept minimal — the parent can always override via custom rendering.
 */
const STATUS_LABEL: Record<StatusBadgeVariant, string> = {
  active:   'Ativo',
  warning:  'Atenção',
  danger:   'Alerta',
  paused:   'Pausado',
  inactive: 'Inativo',
  pending:  'Pendente',
};

/**
 * Returns whether TSB is in the danger zone (< -30).
 */
function isTsbDangerous(tsb: number): boolean {
  return tsb < -30;
}

// ── Default columns rendered when `columns` prop is absent ────────────────────

function renderDefaultCells(athlete: AthleteUIModel) {
  const { ctl, atl, tsb } = athlete.metrics;
  const tsbDanger = isTsbDangerous(tsb);

  return (
    <>
      <Box
        component="td"
        sx={{
          px: 1.5,
          py: 0,
          height: 40,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}
      >
        <MetricCell value={ctl} size="sm" />
      </Box>

      <Box
        component="td"
        sx={{
          px: 1.5,
          py: 0,
          height: 40,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}
      >
        <MetricCell value={atl} size="sm" />
      </Box>

      <Box
        component="td"
        sx={{
          px: 1.5,
          py: 0,
          height: 40,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
          ...(tsbDanger && {
            backgroundColor: `${semantic.danger[500]}1A`,
          }),
        }}
      >
        <Box
          sx={{
            color: tsbDanger ? semantic.danger[500] : 'inherit',
            display: 'inline-flex',
          }}
        >
          <MetricCell value={tsb} size="sm" />
        </Box>
      </Box>
    </>
  );
}

// ── Variant: table ────────────────────────────────────────────────────────────

function TableRow({
  athlete,
  columns,
  selected,
  onSelect,
  onClick,
}: Omit<AthleteRowProps, 'variant' | 'metadata'>) {
  const hasSelect = Boolean(onSelect);
  const isClickable = Boolean(onClick);

  return (
    <Box
      component="tr"
      sx={{
        height: 40,
        cursor: isClickable ? 'pointer' : 'default',
        '&:hover': isClickable
          ? { backgroundColor: `${surface[0]}0A` }
          : undefined,
      }}
      onClick={onClick}
      aria-selected={selected}
    >
      {/* Checkbox column */}
      {hasSelect && (
        <Box
          component="td"
          sx={{
            width: 36,
            px: 0.5,
            py: 0,
            verticalAlign: 'middle',
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Checkbox
            size="small"
            checked={selected ?? false}
            onChange={(e) => onSelect!(e.target.checked)}
            sx={{
              p: 0.5,
              color: surface[500],
              '&.Mui-checked': { color: surface[50] },
            }}
          />
        </Box>
      )}

      {/* Identity cell: Avatar + PhaseIndicator dot + Name */}
      <Box
        component="td"
        sx={{
          px: 1.5,
          py: 0,
          height: 40,
          verticalAlign: 'middle',
          maxWidth: 220,
          minWidth: 140,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CoachAthleteAvatar
            athlete={athlete}
            size="xs"
            status={athlete.statusDot ?? 'none'}
          />

          <PhaseIndicator phase={athlete.phase} variant="dot" />

          <Typography
            component="span"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: surface[50],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
            title={athlete.name}
          >
            {athlete.name}
          </Typography>
        </Box>
      </Box>

      {/* Metric columns */}
      {columns
        ? columns.map((col) => (
            <Box
              key={col.key}
              component="td"
              sx={{
                px: 1.5,
                py: 0,
                height: 40,
                verticalAlign: 'middle',
                whiteSpace: 'nowrap',
              }}
            >
              {col.render
                ? col.render(athlete)
                : (
                  <MetricCell
                    value={
                      col.key in athlete.metrics
                        ? athlete.metrics[col.key as keyof AthleteMetrics]
                        : '—'
                    }
                    size="sm"
                  />
                )}
            </Box>
          ))
        : renderDefaultCells(athlete)}
    </Box>
  );
}

// ── Variant: list ─────────────────────────────────────────────────────────────

function ListRow({
  athlete,
  metadata,
  onClick,
}: Omit<AthleteRowProps, 'variant' | 'columns' | 'selected' | 'onSelect'>) {
  const { borderColor, bgColor } = getListStatusTokens(athlete.status);
  const isClickable = Boolean(onClick);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '0 6px 6px 0',
        backgroundColor: bgColor ?? 'transparent',
        px: 1.5,
        py: 1.25,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        '&:hover': isClickable
          ? { backgroundColor: `${surface[0]}0F` }
          : undefined,
        minHeight: 80,
      }}
      onClick={onClick}
    >
      {/* Avatar */}
      <CoachAthleteAvatar
        athlete={athlete}
        size="sm"
        status={athlete.statusDot ?? 'none'}
      />

      {/* Info column */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Row 1: Name + StatusBadge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography
            component="span"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: surface[50],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
            title={athlete.name}
          >
            {athlete.name}
          </Typography>
          <StatusBadge variant={athlete.status} label={STATUS_LABEL[athlete.status]} size="sm" />
        </Box>

        {/* Row 2: PhaseIndicator pill */}
        <Box>
          <PhaseIndicator phase={athlete.phase} variant="pill" />
        </Box>

        {/* Row 3: Custom metadata from parent */}
        {metadata != null && (
          <Box sx={{ mt: 0.25 }}>
            {metadata}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Variant: calendar ─────────────────────────────────────────────────────────

function CalendarRow({
  athlete,
  onClick,
}: Omit<AthleteRowProps, 'variant' | 'columns' | 'metadata' | 'selected' | 'onSelect'>) {
  const isClickable = Boolean(onClick);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        height: 40,
        cursor: isClickable ? 'pointer' : 'default',
        px: 0.5,
        '&:hover': isClickable
          ? { backgroundColor: `${surface[0]}0A`, borderRadius: '4px' }
          : undefined,
      }}
      onClick={onClick}
    >
      <CoachAthleteAvatar
        athlete={athlete}
        size="xs"
        status={athlete.statusDot ?? 'none'}
      />

      <Typography
        component="span"
        sx={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: surface[50],
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={athlete.name}
      >
        {athlete.name}
      </Typography>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AthleteRow({
  athlete,
  variant,
  columns,
  metadata,
  selected,
  onSelect,
  onClick,
}: AthleteRowProps) {
  switch (variant) {
    case 'table':
      return (
        <TableRow
          athlete={athlete}
          columns={columns}
          selected={selected}
          onSelect={onSelect}
          onClick={onClick}
        />
      );
    case 'list':
      return (
        <ListRow
          athlete={athlete}
          metadata={metadata}
          onClick={onClick}
        />
      );
    case 'calendar':
      return (
        <CalendarRow
          athlete={athlete}
          onClick={onClick}
        />
      );
  }
}

export default AthleteRow;
