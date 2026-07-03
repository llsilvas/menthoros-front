import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { WeeklyWorkout } from '../components/WeeklyPlanList';
import type { CompletionStatus, WorkoutType } from '../components/DayCard';
import { getSafeValue } from '../../../utils/safeValues';
import { mapTipoTreino } from '../../coach/adapters/workoutType';
import { tipoTreinoLabel } from './homeAdapter';
import { parseDuracaoMin } from './parseDuracaoMin';

/** Data local "yyyy-MM-dd" (sem conversão UTC que deslocaria o dia). */
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 7 dias (segunda→domingo) a partir do `semanaInicio` do plano, em horário local. */
export function weekDatesFromInicio(semanaInicio: string): Date[] {
  const [y, m, d] = semanaInicio.split('-').map(Number);
  const inicio = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    return dia;
  });
}

/** Status de execução do backend → status de conclusão do DayCard (D0.4). */
function mapCompletion(statusTreino: TreinoPlanejado['statusTreino']): CompletionStatus {
  switch (getSafeValue(statusTreino)) {
    case 'REALIZADO':
      return 'completed';
    case 'PERDIDO':
      return 'skipped';
    default:
      return 'pending';
  }
}

function durationMinutes(duracao?: string | number): number {
  if (typeof duracao === 'number') return Math.round(duracao);
  return parseDuracaoMin(duracao) ?? 0;
}

/**
 * Monta a semana do DayCard/WeeklyPlanList a partir dos treinos planejados reais do plano,
 * casando cada `dataTreino` com as datas da semana. Dia sem treino correspondente = descanso
 * (workout null). Nunca fabrica treino.
 */
export function buildWeeklyPlan(plano: PlanoSemanal | null, weekDates: Date[]): WeeklyWorkout[] {
  const treinos = plano?.treinosPlanejados ?? [];
  return weekDates.map((date) => {
    const treino = treinos.find((t) => t.dataTreino === toIsoDate(date));
    if (!treino) {
      return { date, workout: null, completionStatus: 'pending' as CompletionStatus };
    }
    const type: WorkoutType = mapTipoTreino(treino.tipoTreino);
    return {
      date,
      workout: {
        type,
        title: tipoTreinoLabel(treino.tipoTreino),
        description: treino.descricao ?? '',
        estimatedTSS: treino.tssPlanejado ?? 0,
        durationMinutes: durationMinutes(treino.duracaoMin),
      },
      completionStatus: mapCompletion(treino.statusTreino),
    };
  });
}
