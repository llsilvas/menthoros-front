import { Box, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { surface } from '../../../theme/tokens';
import { Card } from '../../../shared/components/Card';
import { plural } from '../../coach/adapters/format';
import type { AthleteSeasonPlan, TrainingPhase } from '../../../types/SeasonPlan';

const PHASE_LABEL: Record<TrainingPhase, string> = {
  BASE: 'Base',
  BUILD: 'Construção',
  PEAK: 'Pico',
  TAPER: 'Polimento',
  RACE_WEEK: 'Semana da prova',
};

const MAX_MARCOS = 3;

export interface SeasonCardProps {
  season: AthleteSeasonPlan | null;
}

/** "Minha temporada": para onde a preparação vai. Ausente sem temporada aprovada (A7). */
export function SeasonCard({ season }: SeasonCardProps) {
  if (!season) return null;
  const marcos = season.upcomingMilestones.slice(0, MAX_MARCOS);

  return (
    <Card variant="glass" component="section" aria-label="Minha temporada" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="overline" sx={{ color: surface[400] }}>Minha temporada</Typography>
      <Typography sx={{ color: surface[50], fontWeight: 700 }}>
        {season.raceName} · {format(parseISO(season.raceDate), 'dd/MM/yyyy')}
      </Typography>
      <Typography variant="body2" sx={{ color: surface[200] }}>
        {season.daysToRace === 0 ? 'É hoje' : `Faltam ${plural(season.daysToRace, 'dia', 'dias')}`}
        {season.currentPhase ? ` · Fase: ${PHASE_LABEL[season.currentPhase]}` : ''}
      </Typography>
      {marcos.length ? (
        <Box component="ul" aria-label="Próximos marcos" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 0.25 }}>
          {marcos.map((m) => (
            <Box component="li" key={`${m.name}-${m.date}`} sx={{ fontSize: '0.8125rem', color: surface[100] }}>
              {`${m.name} · ${format(parseISO(m.date), 'dd/MM')}`}
            </Box>
          ))}
        </Box>
      ) : null}
      <Typography variant="caption" sx={{ color: surface[400] }}>
        As semanas futuras são uma previsão e podem mudar conforme seus treinos.
      </Typography>
    </Card>
  );
}

export default SeasonCard;
