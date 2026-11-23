import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { surface } from '../../../theme/tokens';
import {
  START_VOLUME_MAX, coachEditedWeeks, countPhaseWeeks, joinWeeks, parseStartVolume, weeksToRegenerate,
} from '../adapters/seasonAdjust';
import { plural } from '../adapters/format';
import { EDITABLE_PHASES, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { EditablePhase, SeasonPlanRecalculate, SeasonWeek } from '../../../types/SeasonPlan';

const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;
const HINT_SX = { fontSize: '0.8125rem', color: surface[300] } as const;

interface SeasonParametersFormProps {
  weeks: SeasonWeek[];
  totalWeeks: number;
  /** Volume de partida atual; ausente em temporadas anteriores à V121 (o campo começa vazio). */
  initialVolumeKm?: number;
  recalculating: boolean;
  /** Erro do último recálculo, mostrado na confirmação. */
  error?: string | null;
  /** Recalcula; `true` fecha a confirmação. */
  onRecalculate: (input: SeasonPlanRecalculate) => Promise<boolean>;
  /** Confirmação fechada (limpa o erro do último recálculo). */
  onCloseConfirm?: () => void;
}

const mensagemConfirmacao = (weeks: SeasonWeek[]) => {
  const regeneradas = weeksToRegenerate(weeks);
  const editadas = coachEditedWeeks(weeks);
  const partes = [
    regeneradas.length
      ? `O motor regenera ${regeneradas.length === 1 ? 'a semana' : 'as semanas'} ${joinWeeks(regeneradas)}.`
      : 'Nenhuma semana será regenerada; só o volume de partida muda.',
    editadas.length
      ? `${editadas.length === 1 ? 'A semana editada por você' : 'As semanas editadas por você'} (${joinWeeks(editadas)}) ${editadas.length === 1 ? 'fica como está' : 'ficam como estão'}.`
      : '',
    'Semanas concluídas, em andamento e a da prova não mudam.',
  ];
  return partes.filter(Boolean).join(' ');
};

/**
 * Parâmetros do ajuste (add-season-plan-version-diff): semanas por fase, com a soma contra o total ao
 * vivo, e volume de partida. "Recalcular" pede confirmação listando as semanas que o motor regenera.
 */
export function SeasonParametersForm({
  weeks, totalWeeks, initialVolumeKm, recalculating, error = null, onRecalculate, onCloseConfirm,
}: SeasonParametersFormProps) {
  const [fases, setFases] = useState<Record<EditablePhase, string>>(() => {
    const contagem = countPhaseWeeks(weeks);
    return Object.fromEntries(EDITABLE_PHASES.map((p) => [p, String(contagem[p])])) as Record<EditablePhase, string>;
  });
  const [volume, setVolume] = useState(initialVolumeKm == null ? '' : String(initialVolumeKm).replace('.', ','));
  const [confirmando, setConfirmando] = useState(false);

  const numeros = EDITABLE_PHASES.map((p) => (/^\d+$/.test(fases[p]) ? Number(fases[p]) : null));
  const fasesValidas = numeros.every((n) => n !== null);
  const soma = numeros.reduce<number>((acc, n) => acc + (n ?? 0), 0) + 1;
  const diferenca = soma - totalWeeks;
  const volumeKm = parseStartVolume(volume);
  const pronto = fasesValidas && diferenca === 0 && volumeKm !== null;

  const fechar = () => { setConfirmando(false); onCloseConfirm?.(); };
  const recalcular = async () => {
    if (!pronto || volumeKm === null) return;
    const phaseWeeks = Object.fromEntries(EDITABLE_PHASES.map((p) => [p, Number(fases[p])])) as Record<EditablePhase, number>;
    if (await onRecalculate({ phaseWeeks, startVolumeKm: volumeKm })) setConfirmando(false);
  };

  const resumoSoma = diferenca === 0
    ? `Soma: ${plural(soma, 'semana', 'semanas')} com a da prova, igual ao ciclo.`
    : `Soma: ${plural(soma, 'semana', 'semanas')} com a da prova; o ciclo tem ${totalWeeks}. ${diferenca > 0 ? `Tire ${plural(diferenca, 'semana', 'semanas')}.` : `Faltam ${plural(-diferenca, 'semana', 'semanas')}.`}`;

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
        {EDITABLE_PHASES.map((p) => (
          <TextField
            key={p}
            label={TRAINING_PHASE_LABEL[p]}
            value={fases[p]}
            onChange={(e) => setFases({ ...fases, [p]: e.target.value })}
            error={!/^\d+$/.test(fases[p])}
            size="small"
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
        ))}
      </Box>
      <Typography role="status" sx={{ ...HINT_SX, ...(diferenca !== 0 && { color: 'error.main' }) }}>
        {fasesValidas ? resumoSoma : 'Informe um número inteiro de semanas em cada fase.'}
      </Typography>
      <TextField
        label="Volume de partida (km)"
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
        error={volume !== '' && volumeKm === null}
        helperText={`Até ${START_VOLUME_MAX} km, com uma casa decimal.`}
        size="small"
        sx={{ maxWidth: 240 }}
        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      />
      <Box>
        <Button variant="outlined" sx={ACTION_BTN_SX} disabled={!pronto || recalculating} onClick={() => setConfirmando(true)}>
          Recalcular
        </Button>
      </Box>
      <ConfirmDialog
        open={confirmando}
        title="Recalcular o ajuste?"
        message={mensagemConfirmacao(weeks)}
        confirmLabel="Recalcular"
        loading={recalculating}
        errorMessage={error}
        onClose={fechar}
        onConfirm={recalcular}
      />
    </Box>
  );
}
