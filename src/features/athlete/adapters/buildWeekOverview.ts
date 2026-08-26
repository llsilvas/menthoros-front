import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import { workoutTypeColor } from '../../../theme/activeTheme';
import { weekDatesFromInicio } from './buildWeekAgenda';
import { statusDoDia as statusBase, type DayStatus } from './dayStatus';
import type { ProximaProva } from './provasAdapter';

export type DiaStatus = DayStatus | 'hoje';

export interface DiaOverview {
  date: Date;
  iso: string;
  status: DiaStatus;
  /** Cor do tipo de treino pelo enum do backend (`workoutTypeColor`), `null` em dia sem treino. */
  color: string | null;
}

export interface WeekOverview {
  temPlano: boolean;
  dias: DiaOverview[];
  volumeRealizadoKm: number;
  /** `null` sem plano aprovado — a barra não desenha meta inventada. */
  volumePlanejadoKm: number | null;
  streak: number;
  proximaProva: ProximaProva | null;
}

export interface BuildWeekOverviewArgs {
  plano: PlanoSemanal | null;
  treinos: TreinoRealizadoDto[];
  streak: number;
  proximaProva: ProximaProva | null;
  hoje?: Date;
}

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

// Nos sete pontos da Home, hoje é desenhado como anel — o status operacional de hoje fica com o
// Plano. Fora de hoje, a regra é a compartilhada (`dayStatus`).
function statusDoDia(treino: TreinoPlanejado | undefined, date: Date, hoje: Date): DiaStatus {
  if (isSameDay(date, hoje)) return 'hoje';
  return statusBase(treino, date, hoje);
}

/**
 * Card "Sua semana" da Home (D1/D5): streak, volume, sete dias e próxima prova num só lugar —
 * substitui `WeeklySummaryCard`, o card de streak e o de prova. A cor do dia vem do enum do
 * backend via `workoutTypeColor`, nunca do `WorkoutType` local do `DayCard`.
 */
export function buildWeekOverview({ plano, treinos, streak, proximaProva, hoje = new Date() }: BuildWeekOverviewArgs): WeekOverview {
  const dates = plano
    ? weekDatesFromInicio(plano.semanaInicio)
    : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(hoje, { weekStartsOn: 1 }), i));
  const planejados = plano?.treinosPlanejados ?? [];

  const dias = dates.map((date) => {
    const iso = toIso(date);
    const treino = planejados.find((t) => t.dataTreino === iso);
    return {
      date, iso,
      status: statusDoDia(treino, date, hoje),
      color: treino ? workoutTypeColor(treino.tipoTreino) : null,
    };
  });

  const inicio = dias[0].iso;
  const fim = dias[6].iso;
  const volumeDaSemana = treinos
    .filter((t) => t.dataTreino >= inicio && t.dataTreino <= fim)
    .reduce((soma, t) => soma + (t.distanciaKm ?? 0), 0);

  return {
    temPlano: plano !== null,
    dias,
    volumeRealizadoKm: plano ? plano.volumeRealizadoKm : Math.round(volumeDaSemana * 10) / 10,
    volumePlanejadoKm: plano ? plano.volumePlanejadoKm : null,
    streak,
    proximaProva,
  };
}
