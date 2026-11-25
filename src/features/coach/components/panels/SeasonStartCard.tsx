import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery, useTheme } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { surface } from '../../../../theme/tokens';
import { SectionCard } from '../SectionCard';
import { SeasonParametersForm } from '../SeasonParametersForm';
import { formatKmPt } from '../../adapters/format';
import { START_VOLUME_SOURCE_LABEL } from '../../../../types/SeasonPlan';
import type { SeasonPlan, SeasonPlanRecalculate } from '../../../../types/SeasonPlan';

const TEXT_SX = { fontSize: '0.8125rem', color: surface[100] } as const;
const HINT_SX = { fontSize: '0.75rem', color: surface[300] } as const;
const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;

interface SeasonStartCardProps {
  plan: SeasonPlan;
  recalculating: boolean;
  recalcError: Error | null;
  /** Recalcula a proposta v1; `true` fecha o diálogo. Ausente esconde o botão. */
  onRecalculate?: (input: SeasonPlanRecalculate) => Promise<boolean>;
  onClearRecalcError?: () => void;
}

/**
 * Evidência da partida da proposta v1 (season-plan-start-volume): volume e origem, longão de partida e as
 * 8 semanas usadas. "Ajustar volume e fases" abre o `SeasonParametersForm` com o campo de longão.
 */
export function SeasonStartCard({ plan, recalculating, recalcError, onRecalculate, onClearRecalcError }: SeasonStartCardProps) {
  const [aberto, setAberto] = useState(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const fonte = plan.initialVolumeSource;

  const fechar = () => {
    if (recalculating) return;
    setAberto(false);
    onClearRecalcError?.();
  };
  const recalcular = async (input: SeasonPlanRecalculate) => {
    const ok = (await onRecalculate?.(input)) ?? false;
    if (ok) setAberto(false);
    return ok;
  };

  return (
    <SectionCard title="Partida da temporada">
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography sx={TEXT_SX} data-testid="season-start-volume">
          {`Volume de partida: ${plan.initialVolumeKm == null ? '—' : `${formatKmPt(plan.initialVolumeKm)} km`}`}
          {fonte ? ` · ${START_VOLUME_SOURCE_LABEL[fonte]}` : ''}
        </Typography>
        {fonte === 'COACH' && plan.proposedVolumeKm != null ? (
          <Typography sx={HINT_SX}>{`O motor propôs ${formatKmPt(plan.proposedVolumeKm)} km.`}</Typography>
        ) : null}
        <Typography sx={TEXT_SX} data-testid="season-start-long-run">
          {plan.initialLongRunKm == null
            ? 'Longão de partida: sem treino nas últimas 6 semanas (o longão sai de 28% do volume).'
            : `Longão de partida: ${formatKmPt(plan.initialLongRunKm)} km (maior treino das últimas 6 semanas).`}
        </Typography>
        {plan.volumeHistory?.length ? (
          <Box>
            <Typography sx={HINT_SX}>Semanas usadas na partida</Typography>
            <Box component="ul" aria-label="Semanas usadas na partida"
              sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {plan.volumeHistory.map((s) => (
                <Box component="li" key={s.weekStart} sx={TEXT_SX}>
                  {`${format(parseISO(s.weekStart), 'dd/MM')} · ${formatKmPt(s.km)} km`}
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
        {onRecalculate ? (
          <Box>
            <Button variant="outlined" sx={ACTION_BTN_SX} onClick={() => setAberto(true)} disabled={recalculating}>
              Ajustar volume e fases
            </Button>
          </Box>
        ) : null}
      </Box>
      <Dialog open={aberto} onClose={fechar} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <DialogTitle>Ajustar volume e fases</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <SeasonParametersForm
            weeks={plan.weeks}
            totalWeeks={plan.totalWeeks}
            initialVolumeKm={plan.initialVolumeKm}
            withLongRun
            initialLongRunKm={plan.initialLongRunKm}
            recalculating={recalculating}
            error={recalcError?.message}
            onRecalculate={recalcular}
            onCloseConfirm={onClearRecalcError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={fechar} disabled={recalculating} sx={ACTION_BTN_SX}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
  );
}
