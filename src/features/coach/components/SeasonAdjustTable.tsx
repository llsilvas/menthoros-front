import { useState } from 'react';
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { content, surface } from '../../../theme/tokens';
import { formatKmPt } from '../adapters/format';
import { SeasonWeekEditDialog } from './SeasonWeekEditDialog';
import { SEASON_WEEK_LOCK_LABEL, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { SeasonWeek, SeasonWeekUpdate } from '../../../types/SeasonPlan';

const CELL_SX = { fontSize: '0.8125rem', color: surface[100], borderColor: content.divider, py: 0.75 } as const;
const HEAD_SX = { ...CELL_SX, fontSize: '0.75rem', fontWeight: 700, color: surface[400] } as const;
const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;

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
}

/**
 * Semanas do ajuste da temporada (add-season-plan-adjust-v2): as travadas (concluída, em andamento,
 * da prova) mostram o motivo e não têm edição; as futuras abrem o diálogo de edição.
 */
export function SeasonAdjustTable({ weeks, savingWeek, saveError = null, readOnly = false, onSaveWeek, onCloseEdit }: SeasonAdjustTableProps) {
  const [editing, setEditing] = useState<SeasonWeek | null>(null);

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
          {weeks.map((w) => (
            <TableRow key={w.weekIndex} data-testid={`adjust-week-${w.weekIndex}`}>
              <TableCell sx={CELL_SX}>{w.weekIndex}</TableCell>
              <TableCell sx={CELL_SX}>{format(parseISO(w.weekStart), 'dd/MM')}</TableCell>
              <TableCell sx={CELL_SX}>{`${TRAINING_PHASE_LABEL[w.phase] ?? w.phase}${w.deload ? ' · descarga' : ''}`}</TableCell>
              <TableCell sx={CELL_SX} align="right">{`${formatKmPt(w.targetVolumeKm)} km`}</TableCell>
              <TableCell sx={CELL_SX} align="right">{w.longRunKm == null ? '—' : `${formatKmPt(w.longRunKm)} km`}</TableCell>
              <TableCell sx={CELL_SX} align="right">{w.targetTss == null ? '—' : Math.round(w.targetTss)}</TableCell>
              <TableCell sx={CELL_SX}>{w.keySessions || '—'}</TableCell>
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
          ))}
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
