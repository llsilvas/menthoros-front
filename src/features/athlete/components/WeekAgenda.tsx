import { Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import type { AgendaDay, WeekAgenda as WeekAgendaVm } from '../adapters/buildWeekAgenda';
import { WeekAgendaRow } from './WeekAgendaRow';

export interface WeekAgendaProps {
  agenda: WeekAgendaVm;
  expandedIso: string | null;
  onToggle: (iso: string) => void;
  onOpenDetail: (dia: AgendaDay) => void;
  onRegister: () => void;
}

/** Sete linhas numa superfície só (D1) + legenda de cor por tipo, mesma fonte da Home. */
export function WeekAgenda({ agenda, expandedIso, onToggle, onOpenDetail, onRegister }: WeekAgendaProps) {
  const legenda = new Map<string, string>();
  for (const d of agenda.dias) if (d.workout) legenda.set(d.workout.title, d.workout.color);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box data-testid="week-agenda" sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, overflow: 'hidden' }}>
        {agenda.dias.map((dia) => (
          <WeekAgendaRow
            key={dia.iso}
            dia={dia}
            expanded={expandedIso === dia.iso}
            onToggle={onToggle}
            onOpenDetail={onOpenDetail}
            onRegister={onRegister}
          />
        ))}
      </Box>
      {legenda.size > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', px: 0.5 }}>
          {[...legenda].map(([titulo, cor]) => (
            <Box key={titulo} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cor }} />
              <Typography variant="caption" sx={{ color: surface[400] }}>{titulo}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default WeekAgenda;
