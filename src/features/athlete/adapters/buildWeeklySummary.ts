import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import type { AthleteMetricasChave, AthleteProximoTreino } from '../../../types/AthleteHome';
import { FAIXA_APRESENTACAO } from '../../coach/types/AthleteForm';
import type { FaixaTsbStatus } from '../../../types/FaixaTsb';

export interface WeeklySummary {
  totalTreinos: number;
  volumeTotalKm: number;
  streak: number;
  formaAtual: string;
  proximoTreino: string | null;
}

const JANELA_DIAS = 7;
const FORMA_INDISPONIVEL = '—';

/**
 * Resumo da semana (últimos 7 dias) — função pura sobre dados já buscados por hooks existentes
 * (useManualTraining/useAthleteHome), zero endpoint novo. `treinos` pode vir de uma janela maior
 * (ex.: 30 dias, já buscados para o streak) — a filtragem para os últimos 7 dias é feita aqui.
 */
export function buildWeeklySummary(
  treinos: TreinoRealizadoDto[],
  metricasChave: AthleteMetricasChave | undefined,
  proximoTreino: AthleteProximoTreino | undefined,
  streak: number,
  hoje: Date = new Date(),
): WeeklySummary {
  const treinosDaSemana = treinos.filter((t) => {
    const dias = differenceInCalendarDays(hoje, parseISO(t.dataTreino));
    return dias >= 0 && dias < JANELA_DIAS;
  });

  const volumeTotalKm = treinosDaSemana.reduce((soma, t) => soma + (t.distanciaKm ?? 0), 0);

  const faixa = metricasChave?.statusForma as FaixaTsbStatus | undefined;
  const formaAtual = faixa && FAIXA_APRESENTACAO[faixa] ? FAIXA_APRESENTACAO[faixa].label : FORMA_INDISPONIVEL;

  return {
    totalTreinos: treinosDaSemana.length,
    volumeTotalKm,
    streak,
    formaAtual,
    proximoTreino: proximoTreino?.tipoTreino ?? null,
  };
}
