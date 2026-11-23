import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { content, surface } from '../../../theme/tokens';
import { formatKmPt } from '../adapters/format';
import { VALUE_SOURCE_LABEL, diffKey, formatDiffValue, indexDiff } from '../adapters/seasonAdjust';
import { SeasonWeekEditDialog } from './SeasonWeekEditDialog';
import { SEASON_WEEK_LOCK_LABEL, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { SeasonDiffField, SeasonPlanDiffEntry, SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

const CELL_SX = { fontSize: '0.8125rem', color: surface[100], borderColor: content.divider, py: 0.75 } as const;
const HEAD_SX = { ...CELL_SX, fontSize: '0.75rem', fontWeight: 700, color: surface[400] } as const;
const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;
const BEFORE_SX = { color: surface[400], mr: 0.5 } as const;
const SOURCE_SX = { display: 'block', fontSize: '0.6875rem', color: surface[400] } as const;

const faseTexto = (phase: TrainingPhase, deload: boolean) => `${TRAINING_PHASE_LABEL[phase] ?? phase}${deload ? ' · descarga' : ''}`;

/** Valor novo, precedido do valor da ativa riscado quando a célula mudou. */
const comAnterior = (atual: string, anterior: string | null): ReactNode =>
  anterior === null ? atual : (
    <>
      <Box component="del" sx={BEFORE_SX} aria-label={`antes: ${anterior}`}>{anterior}</Box>
      {atual}
    </>
  );

interface SeasonAdjustTableProps {
  weeks: SeasonWeek[];
  /** Semana sendo salva agora. */
  savingWeek: number | null;
  /** Erro do último salvar, mostrado no diálogo. */
  saveError?: string | null;
  /** Ajuste já aprovado ou descartado: nenhuma semana edita. */
  readOnly?: boolean;
  /** Salva a semana; `true` fecha a edição. */
  onSaveWeek: (weekIndex: number, update: SeasonWeekUpdate) => Promise<boolean>;
  /** Diálogo de edição fechado (limpa o erro do último salvar). */
  onCloseEdit?: () => void;
  /** Diff contra a temporada ativa: as células alteradas mostram o valor anterior e a origem da semana. */
  diff?: SeasonPlanDiffEntry[];
}

/**
 * Semanas do ajuste da temporada (add-season-plan-adjust-v2): as travadas (concluída, em andamento,
 * da prova) mostram o motivo e não têm edição; as futuras abrem o diálogo de edição. Com o diff
 * (add-season-plan-version-diff), cada célula alterada mostra o valor da ativa riscado e a semana, a origem.
 */
export function SeasonAdjustTable({
  weeks, savingWeek, saveError = null, readOnly = false, onSaveWeek, onCloseEdit, diff = [],
}: SeasonAdjustTableProps) {
  const [editing, setEditing] = useState<SeasonWeek | null>(null);
  const porCelula = useMemo(() => indexDiff(diff), [diff]);
  const semanasAlteradas = useMemo(() => new Set(diff.map((d) => d.weekIndex)), [diff]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Semanas do ajuste">
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>Semana</TableCell>
            <TableCell sx={HEAD_SX}>Início</TableCell>
            <TableCell sx={HEAD_SX}>Fase</TableCell>
            <TableCell sx={HEAD_SX} align="right">Volume</TableCell>
            <TableCell sx={HEAD_SX} align="right">Longão</TableCell>
            <TableCell sx={HEAD_SX} align="right">TSS</TableCell>
            <TableCell sx={HEAD_SX}>Sessões-chave</TableCell>
            <TableCell sx={HEAD_SX} />
          </TableRow>
        </TableHead>
        <TableBody>
          {weeks.map((w) => {
            const mudou = (field: SeasonDiffField) => porCelula.get(diffKey(w.weekIndex, field));
            const anterior = (field: SeasonDiffField) => {
              const entry = mudou(field);
              return entry ? formatDiffValue(field, entry.before) : null;
            };
            const fase = mudou('phase');
            const descarga = mudou('deload');
            const faseAnterior = fase || descarga
              ? faseTexto((fase ? fase.before : w.phase) as TrainingPhase, Boolean(descarga ? descarga.before : w.deload))
              : null;
            return (
              <TableRow key={w.weekIndex} data-testid={`adjust-week-${w.weekIndex}`}>
                <TableCell sx={CELL_SX}>
                  {w.weekIndex}
                  {semanasAlteradas.has(w.weekIndex) ? (
                    <Typography component="span" sx={SOURCE_SX}>{VALUE_SOURCE_LABEL[w.valueSource]}</Typography>
                  ) : null}
                </TableCell>
                <TableCell sx={CELL_SX}>{format(parseISO(w.weekStart), 'dd/MM')}</TableCell>
                <TableCell sx={CELL_SX}>{comAnterior(faseTexto(w.phase, w.deload), faseAnterior)}</TableCell>
                <TableCell sx={CELL_SX} align="right">{comAnterior(`${formatKmPt(w.targetVolumeKm)} km`, anterior('targetVolumeKm'))}</TableCell>
                <TableCell sx={CELL_SX} align="right">
                  {comAnterior(w.longRunKm == null ? '—' : `${formatKmPt(w.longRunKm)} km`, anterior('longRunKm'))}
                </TableCell>
                <TableCell sx={CELL_SX} align="right">
                  {comAnterior(w.targetTss == null ? '—' : String(Math.round(w.targetTss)), anterior('targetTss'))}
                </TableCell>
                <TableCell sx={CELL_SX}>{comAnterior(w.keySessions || '—', anterior('keySessions'))}</TableCell>
                <TableCell sx={CELL_SX}>
                  {w.locked ? (
                    <Chip size="small" label={w.lockReason ? SEASON_WEEK_LOCK_LABEL[w.lockReason] : 'Travada'} />
                  ) : readOnly ? null : (
                    <Button size="small" sx={ACTION_BTN_SX} aria-label={`Editar semana ${w.weekIndex}`} onClick={() => setEditing(w)}>
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {editing ? (
        <SeasonWeekEditDialog
          week={editing}
          saving={savingWeek === editing.weekIndex}
          error={saveError}
          onClose={() => { setEditing(null); onCloseEdit?.(); }}
          onSave={(update) => onSaveWeek(editing.weekIndex, update)}
        />
      ) : null}
    </Box>
  );
}
