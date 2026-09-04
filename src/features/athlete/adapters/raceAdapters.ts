import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { extractDistanciaKey, extractStatusKey, extractTipoKey } from '../../../types/Prova';
import type { DistanciaProva, Prova, TipoProva } from '../../../types/Prova';
import { rotuloDistancia, semanasFaltando } from '../../../utils/racePreparation';

export type Terreno = 'RUA' | 'TRAIL';

export const TERRENO_LABELS: Record<Terreno, string> = { RUA: 'Rua', TRAIL: 'Trail' };

/** View model de uma prova nas telas do atleta (lista, faixa do Plano). */
export interface AthleteRaceView {
  id: string;
  nome: string;
  dataIso: string;
  /** "6 de dez de 2026" */
  dataLabel: string;
  distancia: DistanciaProva;
  distanciaKm?: number;
  distanciaLabel: string;
  tipoProva: TipoProva;
  terreno: Terreno;
  alvo: boolean;
  realizada: boolean;
  tempoObjetivo?: string;
  semanasFaltando: number;
  /** Mínimo da tabela, derivado pelo backend; ausente em prova legada sem derivação. */
  semanasMinimas?: number;
  preparacaoCurta: boolean;
}

export function terrenoDe(tipoProva: TipoProva): Terreno {
  return tipoProva === 'TRAIL' ? 'TRAIL' : 'RUA';
}

/** Regra do formulário (design D7): 21 → MEIA, 42 → MARATONA, senão pelo terreno. */
export function tipoProvaDerivado(distancia: DistanciaProva, terreno: Terreno): TipoProva {
  if (distancia === 'KM_21') return 'MEIA';
  if (distancia === 'KM_42') return 'MARATONA';
  return terreno === 'TRAIL' ? 'TRAIL' : 'CORRIDA_RUA';
}

export function buildAthleteRaceView(prova: Prova, hoje: Date = new Date()): AthleteRaceView {
  const distancia = extractDistanciaKey(prova.distancia) ?? 'KM_10';
  const tipoProva = extractTipoKey(prova.tipoProva) ?? 'CORRIDA_RUA';
  return {
    id: prova.id,
    nome: prova.nomeProva,
    dataIso: prova.dataProva,
    dataLabel: format(parseISO(prova.dataProva), "d 'de' MMM 'de' yyyy", { locale: ptBR }),
    distancia,
    distanciaKm: prova.distanciaKm,
    distanciaLabel: rotuloDistancia(distancia, prova.distanciaKm),
    tipoProva,
    terreno: terrenoDe(tipoProva),
    alvo: prova.provaAlvo === true,
    realizada: prova.foiRealizada === true || extractStatusKey(prova.statusProva) === 'CONCLUIDA',
    tempoObjetivo: prova.tempoObjetivo,
    semanasFaltando: prova.semanasFaltando ?? semanasFaltando(prova.dataProva, hoje),
    semanasMinimas: prova.semanasPreparacao,
    preparacaoCurta: prova.preparacaoCurta === true,
  };
}

/** Lista para a tela "Minhas provas": alvo primeiro, depois por data. */
export function buildAthleteRaceList(provas: Prova[], hoje: Date = new Date()): AthleteRaceView[] {
  return provas
    .map((p) => buildAthleteRaceView(p, hoje))
    .sort((a, b) => Number(b.alvo) - Number(a.alvo) || a.dataIso.localeCompare(b.dataIso));
}

/** Prova-alvo futura e não realizada; `null` quando não há. */
export function selectTargetRace(provas: Prova[], hoje: Date = new Date()): AthleteRaceView | null {
  const hojeIso = format(hoje, 'yyyy-MM-dd');
  const alvo = provas.find((p) => p.provaAlvo === true && p.foiRealizada !== true && p.dataProva >= hojeIso);
  return alvo ? buildAthleteRaceView(alvo, hoje) : null;
}

/** Provas futuras não realizadas (candidatas a alvo). */
export function countUpcomingRaces(provas: Prova[], hoje: Date = new Date()): number {
  const hojeIso = format(hoje, 'yyyy-MM-dd');
  return provas.filter((p) => p.foiRealizada !== true && p.dataProva >= hojeIso).length;
}

/** Segunda-feira da semana que contém `d`, hora zerada. */
/** View model da faixa "Prova nesta semana" (prova-no-plano-semanal, design.md D7). */
export interface RaceThisWeekView {
  id: string;
  nome: string;
  dataIso: string;
  /** "domingo" — nome do dia da semana da prova. */
  diaSemanaLabel: string;
  /** Dias até a prova, nunca negativo (prova hoje = 0). */
  diasFaltando: number;
}

/**
 * Prova não cancelada nem realizada cuja data cai na semana corrente (segunda→domingo). Tem
 * prioridade sobre a prova-alvo na faixa do Plano — é o que está prestes a acontecer, alvo ou não.
 */
export function selectRaceThisWeek(provas: Prova[], hoje: Date = new Date()): RaceThisWeekView | null {
  const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const inicioIso = format(inicio, 'yyyy-MM-dd');
  const fimIso = format(fim, 'yyyy-MM-dd');

  const candidatas = provas
    .filter((p) => p.foiRealizada !== true
      && extractStatusKey(p.statusProva) !== 'CANCELADA'
      && p.dataProva >= inicioIso && p.dataProva <= fimIso)
    .sort((a, b) => a.dataProva.localeCompare(b.dataProva));

  const candidata = candidatas[0];
  if (!candidata) return null;

  const dataProva = parseISO(candidata.dataProva);
  return {
    id: candidata.id,
    nome: candidata.nomeProva,
    dataIso: candidata.dataProva,
    diaSemanaLabel: format(dataProva, 'EEEE', { locale: ptBR }),
    diasFaltando: Math.max(0, differenceInCalendarDays(dataProva, hoje)),
  };
}
