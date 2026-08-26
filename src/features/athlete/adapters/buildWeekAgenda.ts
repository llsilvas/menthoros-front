import { format, isSameDay } from 'date-fns';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { workoutTypeColor } from '../../../theme/activeTheme';
import { tipoTreinoLabel } from './homeAdapter';
import { parseDuracaoMin } from './parseDuracaoMin';
import { statusDoDia, treinoConcluido, type DayStatus } from './dayStatus';

export type AgendaDayStatus = DayStatus;

export interface AgendaWorkout {
  title: string;
  description: string;
  /** Cor do tipo pelo enum do backend (`workoutTypeColor`) — a mesma da Home. */
  color: string;
  durationMin?: number;
  /** Prescrita (`distanciaKm`) ou derivada de duração × `ritmoAlvo`; ausente quando não há base. */
  distanceKm?: number;
  distanceEstimated: boolean;
  zoneLabel?: string;
  temEtapas: boolean;
  treino: TreinoPlanejado;
}

export interface AgendaDay {
  date: Date;
  iso: string;
  /** Hoje é um eixo próprio: um treino feito hoje é `concluido` E `isToday`. */
  isToday: boolean;
  status: AgendaDayStatus;
  workout: AgendaWorkout | null;
}

export interface WeekAgenda {
  dias: AgendaDay[];
  contemHoje: boolean;
  /** 1..7 quando o plano contém hoje; `null` quando é outra semana. */
  diaDaSemana: number | null;
  treinosPlanejados: number;
  treinosFeitos: number;
}

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

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


/** Aceita número, "HH:MM:SS"/"MM:SS" (serialização do backend) e "50 min" (texto livre do coach). */
function duracaoMinutos(duracao?: string | number): number | undefined {
  if (typeof duracao === 'number') return Math.round(duracao);
  const serializada = parseDuracaoMin(duracao);
  if (serializada !== null) return serializada;
  const livre = duracao?.match(/^\s*(\d+)/);
  return livre ? Number(livre[1]) : undefined;
}

/** "5:00 min/km" → 5.0; "4:45" → 4.75; qualquer outra forma → `undefined`. */
function paceMinPorKm(ritmoAlvo?: string): number | undefined {
  const m = ritmoAlvo?.match(/(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const min = Number(m[1]) + Number(m[2]) / 60;
  return min > 0 ? min : undefined;
}

function distancia(treino: TreinoPlanejado, durationMin?: number): { km?: number; estimada: boolean } {
  if (treino.distanciaKm && treino.distanciaKm > 0) return { km: treino.distanciaKm, estimada: false };
  const pace = paceMinPorKm(treino.ritmoAlvo);
  if (durationMin && pace) return { km: Math.round((durationMin / pace) * 10) / 10, estimada: true };
  return { estimada: false };
}

/**
 * Agenda vertical do Plano (design D1/D2): sete dias da semana do plano, status por dia, cor por
 * `workoutTypeColor` (enum do backend — nunca o `WorkoutType` local do antigo DayCard), distância
 * prescrita antes de derivada, e `temEtapas` por treino para o toque decidir entre expandir e abrir
 * o detalhe. "Hoje" é a data local do aparelho.
 */
export function buildWeekAgenda(plano: PlanoSemanal, hoje: Date = new Date()): WeekAgenda {
  const dates = weekDatesFromInicio(plano.semanaInicio);
  const treinos = plano.treinosPlanejados ?? [];

  const dias: AgendaDay[] = dates.map((date) => {
    const iso = toIso(date);
    const treino = treinos.find((t) => t.dataTreino === iso);
    const isToday = isSameDay(date, hoje);
    const status = statusDoDia(treino, date, hoje);
    if (!treino) return { date, iso, isToday, status, workout: null };
    const durationMin = duracaoMinutos(treino.duracaoMin);
    const { km, estimada } = distancia(treino, durationMin);
    return {
      date, iso, isToday, status,
      workout: {
        title: tipoTreinoLabel(treino.tipoTreino),
        description: treino.descricao ?? '',
        color: workoutTypeColor(treino.tipoTreino),
        durationMin,
        distanceKm: km,
        distanceEstimated: estimada,
        zoneLabel: treino.zonaAlvo || undefined,
        temEtapas: (treino.etapas?.length ?? 0) > 0,
        treino,
      },
    };
  });

  const indiceHoje = dias.findIndex((d) => d.isToday);
  const planejados = dias.filter((d) => d.workout !== null);
  const feitos = planejados.filter((d) => treinoConcluido(d.workout!.treino));

  return {
    dias,
    contemHoje: indiceHoje >= 0,
    diaDaSemana: indiceHoje >= 0 ? indiceHoje + 1 : null,
    treinosPlanejados: planejados.length,
    treinosFeitos: feitos.length,
  };
}
