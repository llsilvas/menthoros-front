import { useState } from 'react';
import {
  Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { content, surface } from '../../../theme/tokens';
import { formatKmPt } from '../adapters/format';
import { EDITABLE_PHASES, SEASON_WEEK_LOCK_LABEL, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

const CELL_SX = { fontSize: '0.8125rem', color: surface[100], borderColor: content.divider, py: 0.75 } as const;
const HEAD_SX = { ...CELL_SX, fontSize: '0.75rem', fontWeight: 700, color: surface[400] } as const;
const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;
const KEY_SESSIONS_MAX = 500;

interface WeekForm {
  phase: TrainingPhase;
  targetVolumeKm: string;
  longRunKm: string;
  targetTss: string;
  deload: boolean;
  keySessions: string;
}

const toForm = (w: SeasonWeek): WeekForm => ({
  phase: w.phase,
  targetVolumeKm: String(w.targetVolumeKm ?? ''),
  longRunKm: w.longRunKm == null ? '' : String(w.longRunKm),
  targetTss: w.targetTss == null ? '' : String(Math.round(w.targetTss)),
  deload: w.deload,
  keySessions: w.keySessions ?? '',
});

/** Número não negativo digitado com vírgula ou ponto; vazio = sem valor, inválido = NaN. */
const parseNumero = (texto: string): number | undefined => {
  const limpo = texto.trim().replace(',', '.');
  if (!limpo) return undefined;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
};

interface SeasonAdjustTableProps {
  weeks: SeasonWeek[];
  /** Semana sendo salva agora (bloqueia a edição dela). */
  savingWeek: number | null;
  /** Salva a semana; `true` fecha a edição. */
  onSaveWeek: (weekIndex: number, update: SeasonWeekUpdate) => Promise<boolean>;
}

/**
 * Semanas do ajuste da temporada (add-season-plan-adjust-v2): as travadas (concluída, em andamento,
 * da prova) mostram o motivo e não têm edição; as futuras abrem a edição por linha.
 */
export function SeasonAdjustTable({ weeks, savingWeek, onSaveWeek }: SeasonAdjustTableProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<WeekForm | null>(null);

  const abrir = (w: SeasonWeek) => {
    setEditing(w.weekIndex);
    setForm(toForm(w));
  };
  const fechar = () => {
    setEditing(null);
    setForm(null);
  };

  const volume = form ? parseNumero(form.targetVolumeKm) : undefined;
  const longao = form ? parseNumero(form.longRunKm) : undefined;
  const tss = form ? parseNumero(form.targetTss) : undefined;
  const invalido = [volume, longao, tss].some((n) => Number.isNaN(n));

  const salvar = async (weekIndex: number) => {
    if (!form || invalido) return;
    const ok = await onSaveWeek(weekIndex, {
      phase: form.phase,
      targetVolumeKm: volume,
      longRunKm: longao,
      targetTss: tss,
      deload: form.deload,
      keySessions: form.keySessions.trim(),
    });
    if (ok) fechar();
  };

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
          {weeks.map((w) => (editing === w.weekIndex && form ? (
            <TableRow key={w.weekIndex} data-testid={`adjust-week-${w.weekIndex}`}>
              <TableCell sx={CELL_SX}>{w.weekIndex}</TableCell>
              <TableCell sx={CELL_SX}>{format(parseISO(w.weekStart), 'dd/MM')}</TableCell>
              <TableCell sx={CELL_SX}>
                <TextField
                  select size="small" label="Fase" value={form.phase}
                  onChange={(e) => setForm({ ...form, phase: e.target.value as TrainingPhase })}
                >
                  {EDITABLE_PHASES.map((p) => <MenuItem key={p} value={p}>{TRAINING_PHASE_LABEL[p]}</MenuItem>)}
                </TextField>
                <FormControlLabel
                  control={<Checkbox size="small" checked={form.deload} onChange={(e) => setForm({ ...form, deload: e.target.checked })} />}
                  label="Descarga"
                />
              </TableCell>
              <TableCell sx={CELL_SX} align="right">
                <TextField size="small" label="Volume (km)" value={form.targetVolumeKm} inputProps={{ inputMode: 'decimal' }}
                  error={Number.isNaN(volume)} onChange={(e) => setForm({ ...form, targetVolumeKm: e.target.value })} />
              </TableCell>
              <TableCell sx={CELL_SX} align="right">
                <TextField size="small" label="Longão (km)" value={form.longRunKm} inputProps={{ inputMode: 'decimal' }}
                  error={Number.isNaN(longao)} onChange={(e) => setForm({ ...form, longRunKm: e.target.value })} />
              </TableCell>
              <TableCell sx={CELL_SX} align="right">
                <TextField size="small" label="TSS" value={form.targetTss} inputProps={{ inputMode: 'numeric' }}
                  error={Number.isNaN(tss)} onChange={(e) => setForm({ ...form, targetTss: e.target.value })} />
              </TableCell>
              <TableCell sx={CELL_SX}>
                <TextField size="small" label="Sessões-chave" value={form.keySessions} multiline
                  inputProps={{ maxLength: KEY_SESSIONS_MAX }}
                  onChange={(e) => setForm({ ...form, keySessions: e.target.value })} />
              </TableCell>
              <TableCell sx={CELL_SX}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button variant="contained" size="small" sx={ACTION_BTN_SX} disabled={invalido || savingWeek === w.weekIndex}
                    onClick={() => void salvar(w.weekIndex)}>
                    {savingWeek === w.weekIndex ? 'Salvando…' : 'Salvar'}
                  </Button>
                  <Button size="small" sx={ACTION_BTN_SX} onClick={fechar} disabled={savingWeek === w.weekIndex}>
                    Cancelar
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow key={w.weekIndex} data-testid={`adjust-week-${w.weekIndex}`}>
              <TableCell sx={CELL_SX}>{w.weekIndex}</TableCell>
              <TableCell sx={CELL_SX}>{format(parseISO(w.weekStart), 'dd/MM')}</TableCell>
              <TableCell sx={CELL_SX}>
                {`${TRAINING_PHASE_LABEL[w.phase] ?? w.phase}${w.deload ? ' · descarga' : ''}`}
              </TableCell>
              <TableCell sx={CELL_SX} align="right">{`${formatKmPt(w.targetVolumeKm)} km`}</TableCell>
              <TableCell sx={CELL_SX} align="right">{w.longRunKm == null ? '—' : `${formatKmPt(w.longRunKm)} km`}</TableCell>
              <TableCell sx={CELL_SX} align="right">{w.targetTss == null ? '—' : Math.round(w.targetTss)}</TableCell>
              <TableCell sx={CELL_SX}>{w.keySessions || '—'}</TableCell>
              <TableCell sx={CELL_SX}>
                {w.locked ? (
                  <Chip size="small" label={w.lockReason ? SEASON_WEEK_LOCK_LABEL[w.lockReason] : 'Travada'} />
                ) : (
                  <Button size="small" sx={ACTION_BTN_SX} aria-label={`Editar semana ${w.weekIndex}`}
                    disabled={editing !== null} onClick={() => abrir(w)}>
                    Editar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </Box>
  );
}
