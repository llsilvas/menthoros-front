import { Box, Typography } from '@mui/material';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { primary, semantic, surface } from '../../../theme/tokens';
import { formatKmPt } from '../adapters/format';
import type { SeasonMilestone, SeasonWeek, TrainingPhase } from '../../../types/SeasonPlan';

// Mesmas cores do PhaseIndicator; Pico usa a cor de destaque e a semana da prova, a neutra.
const PHASE_COLOR: Record<TrainingPhase, string> = {
  BASE: semantic.info[500],
  BUILD: semantic.warning[500],
  PEAK: primary[500],
  TAPER: semantic.success[500],
  RACE_WEEK: surface[300],
};

interface SeasonMapChartProps {
  weeks: SeasonWeek[];
  milestones: SeasonMilestone[];
  peakVolumeKm: number;
  currentWeekIndex?: number;
}

/** Resumo do mapa para leitor de tela; a tabela de semanas é a alternativa completa. */
function describeMap(weeks: SeasonWeek[], milestones: SeasonMilestone[], peakVolumeKm: number): string {
  const descargas = weeks.filter((w) => w.deload).map((w) => w.weekIndex);
  const partes = [`Mapa da temporada: ${weeks.length} semanas, pico de ${formatKmPt(peakVolumeKm)} km`];
  if (descargas.length) partes.push(`descargas nas semanas ${descargas.join(', ')}`);
  if (milestones.length) partes.push(`marcos: ${milestones.map((m) => `${m.name} na semana ${m.weekIndex}`).join(', ')}`);
  return partes.join('; ');
}

/** Volume planejado por semana, colorido pela fase; descarga esmaecida, marcos em linha vertical. */
export function SeasonMapChart({ weeks, milestones, peakVolumeKm, currentWeekIndex }: SeasonMapChartProps) {
  return (
    <Box role="img" aria-label={describeMap(weeks, milestones, peakVolumeKm)}>
      <Box sx={{ height: 140 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="weekIndex" tick={{ fill: surface[400], fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            {milestones.map((m) => (
              <ReferenceLine key={m.provaId} x={m.weekIndex} stroke={surface[200]} strokeDasharray="3 3" />
            ))}
            <Bar dataKey="targetVolumeKm" isAnimationActive={false} radius={[3, 3, 0, 0]}>
              {weeks.map((w) => (
                <Cell
                  key={w.weekIndex}
                  fill={PHASE_COLOR[w.phase] ?? surface[400]}
                  fillOpacity={w.deload ? 0.45 : 1}
                  stroke={w.weekIndex === currentWeekIndex ? surface[50] : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Typography component="p" sx={{ fontSize: '0.75rem', color: surface[400], mt: 0.5 }} aria-hidden>
        Barra mais clara = descarga · linha tracejada = prova preparatória · contorno = semana atual
      </Typography>
    </Box>
  );
}
