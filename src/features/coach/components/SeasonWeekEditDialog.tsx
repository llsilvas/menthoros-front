import { useState } from 'react';
import {
  Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, Typography,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { surface } from '../../../theme/tokens';
import { formatKmPt, plural } from '../adapters/format';
import {
  KEY_SESSIONS_MAX, consequenciaRecalculo, picoDeSubida, picoSugerido, podeRecalcular, toSeasonWeekForm,
  toSeasonWeekUpdate, tssProporcional, validateSeasonWeekForm,
} from '../adapters/seasonWeekForm';
import type { SeasonWeekForm } from '../adapters/seasonWeekForm';
import { EDITABLE_PHASES, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

const CONSEQUENCIA_SX = { display: 'block', ml: 4, mt: -0.5, mb: 0.5, fontSize: '0.75rem', color: surface[400] } as const;

interface SeasonWeekEditDialogProps {
  week: SeasonWeek;
  /** Semanas da temporada: semana seguinte, pico atual e sugerido, e quantas o recálculo reescreve. */
  weeks: SeasonWeek[];
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
export function SeasonWeekEditDialog({ week, weeks, saving, error = null, onClose, onSave }: SeasonWeekEditDialogProps) {
  const [form, setForm] = useState<SeasonWeekForm>(() => toSeasonWeekForm(week));
  // Depois que o treinador digita no TSS ou no pico, o volume não os preenche mais.
  const [tssEditado, setTssEditado] = useState(false);
  const [picoEditado, setPicoEditado] = useState(false);
  const erros = validateSeasonWeekForm(form);
  const invalido = Object.keys(erros).length > 0;
  const set = <K extends keyof SeasonWeekForm>(campo: K, valor: SeasonWeekForm[K]) => setForm({ ...form, [campo]: valor });

  const mudar = (campo: 'targetVolumeKm' | 'longRunKm' | 'targetTss' | 'followingPeakVolumeKm', valor: string) => {
    if (campo === 'targetTss') setTssEditado(true);
    if (campo === 'followingPeakVolumeKm') setPicoEditado(true);
    if (campo !== 'targetVolumeKm') return set(campo, valor);
    const tss = tssEditado ? undefined : tssProporcional(week, valor);
    setForm({
      ...form,
      targetVolumeKm: valor,
      ...(tss === undefined ? {} : { targetTss: tss }),
      ...(picoEditado ? {} : { followingPeakVolumeKm: picoSugerido(weeks, week, valor) }),
    });
  };

  const salvar = async () => {
    if (!invalido && await onSave(toSeasonWeekUpdate(form))) onClose();
  };

  const seguinte = weeks.find((w) => w.weekIndex === week.weekIndex + 1);
  const { reescritas, mantidas } = consequenciaRecalculo(weeks, week.weekIndex);

  const numero = (
    campo: 'targetVolumeKm' | 'longRunKm' | 'targetTss' | 'followingPeakVolumeKm', label: string,
    { autoFocus = false, ajuda = ' ' }: { autoFocus?: boolean; ajuda?: string } = {},
  ) => (
    <TextField
      label={label}
      value={form[campo]}
      autoFocus={autoFocus}
      required
      error={!!erros[campo]}
      helperText={erros[campo] ?? ajuda}
      onChange={(e) => mudar(campo, e.target.value)}
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
        {numero('targetVolumeKm', 'Volume (km)', { autoFocus: true })}
        {numero('longRunKm', 'Longão (km)')}
        {numero('targetTss', 'TSS')}
        {podeRecalcular(form) ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <RadioGroup
              aria-label="Semanas seguintes"
              value={form.recalcular ? 'recalcular' : 'so-esta'}
              onChange={(e) => set('recalcular', e.target.value === 'recalcular')}
            >
              <FormControlLabel value="so-esta" control={<Radio />} label="Só esta semana" />
              {seguinte ? (
                <Typography component="span" sx={CONSEQUENCIA_SX}>
                  {`A semana ${seguinte.weekIndex} continua em ${formatKmPt(seguinte.targetVolumeKm)} km`}
                </Typography>
              ) : null}
              <FormControlLabel value="recalcular" control={<Radio />} label="Recalcular as semanas seguintes até a prova" />
              <Typography component="span" sx={CONSEQUENCIA_SX}>
                {`Reescreve ${plural(reescritas, 'semana', 'semanas')}; ${mantidas} ${mantidas === 1 ? 'fica como está' : 'ficam como estão'} `
                  + '(editadas por você ou travadas). Fase e descarga não mudam.'}
              </Typography>
            </RadioGroup>
            {form.recalcular
              ? numero('followingPeakVolumeKm', 'Volume de pico (km)', {
                ajuda: `hoje ${formatKmPt(picoDeSubida(weeks, week.weekIndex))} km`,
              })
              : null}
          </Box>
        ) : null}
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
