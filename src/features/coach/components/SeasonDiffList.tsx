import { Alert, Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import { DIFF_FIELD_LABEL, VALUE_SOURCE_LABEL, formatDiffValue } from '../adapters/seasonAdjust';
import type { SeasonPlanDiffEntry } from '../../../types/SeasonPlan';

const LIST_SX = { m: 0, pl: 2.5, display: 'grid', gap: 0.5 } as const;
const ITEM_SX = { fontSize: '0.8125rem', color: surface[100] } as const;

interface SeasonDiffListProps {
  diff: SeasonPlanDiffEntry[];
  /** Versão ativa com que o ajuste é comparado. */
  baseVersion: number;
  error?: string | null;
}

/** Bloco "Alterações" do ajuste (add-season-plan-version-diff): o que muda em relação à versão ativa. */
export function SeasonDiffList({ diff, baseVersion, error = null }: SeasonDiffListProps) {
  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!diff.length) {
    return (
      <Typography sx={{ fontSize: '0.8125rem', color: surface[300] }}>
        {`Nenhuma alteração em relação à versão ${baseVersion}.`}
      </Typography>
    );
  }
  return (
    <Box component="ul" aria-label="Alterações" sx={LIST_SX}>
      {diff.map((d) => (
        <Box component="li" key={`${d.weekIndex}-${d.field}`} sx={ITEM_SX}>
          {`Semana ${d.weekIndex} · ${DIFF_FIELD_LABEL[d.field]}: ${formatDiffValue(d.field, d.before)} → ${formatDiffValue(d.field, d.after)} (${VALUE_SOURCE_LABEL[d.source]})`}
        </Box>
      ))}
    </Box>
  );
}
