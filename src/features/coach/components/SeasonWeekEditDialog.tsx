import { useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import {
  KEY_SESSIONS_MAX, toSeasonWeekForm, toSeasonWeekUpdate, validateSeasonWeekForm,
} from '../adapters/seasonWeekForm';
import type { SeasonWeekForm } from '../adapters/seasonWeekForm';
import { EDITABLE_PHASES, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

interface SeasonWeekEditDialogProps {
  week: SeasonWeek;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  /** Salva; `true` fecha o diálogo. */
  onSave: (update: SeasonWeekUpdate) => Promise<boolean>;
}

/**
 * Edição de uma semana do ajuste da temporada (add-season-plan-adjust-v2). Diálogo em vez de edição
 * na linha: seis campos não cabem numa linha de tabela no celular (tela cheia ali), e o foco volta
 * ao "Editar" ao fechar.
 */
export function SeasonWeekEditDialog({ week, saving, error = null, onClose, onSave }: SeasonWeekEditDialogProps) {
  const [form, setForm] = useState<SeasonWeekForm>(() => toSeasonWeekForm(week));
  const erros = validateSeasonWeekForm(form);
  const invalido = Object.keys(erros).length > 0;
  const set = <K extends keyof SeasonWeekForm>(campo: K, valor: SeasonWeekForm[K]) => setForm({ ...form, [campo]: valor });

  const salvar = async () => {
    if (!invalido && await onSave(toSeasonWeekUpdate(form))) onClose();
  };

  const numero = (campo: 'targetVolumeKm' | 'longRunKm' | 'targetTss', label: string, autoFocus = false) => (
    <TextField
      label={label}
      value={form[campo]}
      autoFocus={autoFocus}
      required
      error={!!erros[campo]}
      helperText={erros[campo] ?? ' '}
      onChange={(e) => set(campo, e.target.value)}
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
    />
  );

  return (
    <CoachDialog
      open
      onClose={saving ? () => undefined : onClose}
      disableClose={saving}
      title={`Semana ${week.weekIndex}`}
      subtitle={`Início em ${format(parseISO(week.weekStart), 'dd/MM/yyyy')}`}
      component="form"
      onSubmit={(e) => { e.preventDefault(); void salvar(); }}
      actions={
        <>
          <Button sx={GHOST_BTN_SX} onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" sx={PRIMARY_BTN_SX} disabled={invalido || saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {error ? <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert> : null}
        <TextField select label="Fase" value={form.phase} onChange={(e) => set('phase', e.target.value as TrainingPhase)}>
          {EDITABLE_PHASES.map((p) => <MenuItem key={p} value={p}>{TRAINING_PHASE_LABEL[p]}</MenuItem>)}
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={form.deload} onChange={(e) => set('deload', e.target.checked)} />}
          label="Semana de descarga"
        />
        {numero('targetVolumeKm', 'Volume (km)', true)}
        {numero('longRunKm', 'Longão (km)')}
        {numero('targetTss', 'TSS')}
        <TextField
          label="Sessões-chave"
          value={form.keySessions}
          multiline
          minRows={2}
          sx={{ gridColumn: '1 / -1' }}
          helperText={`${form.keySessions.length}/${KEY_SESSIONS_MAX}`}
          onChange={(e) => set('keySessions', e.target.value)}
          slotProps={{ htmlInput: { maxLength: KEY_SESSIONS_MAX } }}
        />
      </Box>
    </CoachDialog>
  );
}
