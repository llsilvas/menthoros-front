import { differenceInCalendarDays, parseISO, startOfDay, subWeeks } from 'date-fns';
import type { DistanciaProva } from '../types/Prova';

/**
 * Tabela de semanas mínimas de preparação por distância — a mesma de
 * `RacePreparationRule` no backend (spec prova-preparacao-minima). Aqui ela só dá feedback
 * imediato no formulário; o valor gravado e o chip da lista vêm do `ProvaOutputDto`.
 */
const SEMANAS_POR_DISTANCIA: Record<Exclude<DistanciaProva, 'CUSTOMIZADA'>, number> = {
  KM_5: 8,
  KM_10: 10,
  KM_21: 12,
  KM_42: 16,
};

const LIMITE_FAIXA_5K = 7.5;
const LIMITE_FAIXA_10K = 15;
const LIMITE_FAIXA_21K = 30;

export function minimoSemanas(distancia: DistanciaProva, distanciaKm?: number | null): number {
  if (distancia !== 'CUSTOMIZADA') return SEMANAS_POR_DISTANCIA[distancia];
  if (distanciaKm == null || !(distanciaKm > 0)) {
    throw new Error('Distância customizada exige quilometragem positiva');
  }
  if (distanciaKm <= LIMITE_FAIXA_5K) return 8;
  if (distanciaKm <= LIMITE_FAIXA_10K) return 10;
  if (distanciaKm <= LIMITE_FAIXA_21K) return 12;
  return 16;
}

/** Rótulo curto da distância ("21 km", "30 km"). */
export function rotuloDistancia(distancia: DistanciaProva, distanciaKm?: number | null): string {
  switch (distancia) {
    case 'KM_5': return '5 km';
    case 'KM_10': return '10 km';
    case 'KM_21': return '21 km';
    case 'KM_42': return '42 km';
    case 'CUSTOMIZADA': return distanciaKm != null ? `${distanciaKm} km` : 'Outra';
  }
}

/** Semanas inteiras até a prova (`floor(dias / 7)`), nunca negativo. */
export function semanasFaltando(dataProvaIso: string, hoje: Date = new Date()): number {
  const dias = differenceInCalendarDays(parseISO(dataProvaIso), startOfDay(hoje));
  return dias <= 0 ? 0 : Math.floor(dias / 7);
}

export interface AvaliacaoPreparacao {
  semanasMinimas: number;
  semanasFaltando: number;
  inicioPreparacao: Date;
  preparacaoCurta: boolean;
}

/** Avalia o prazo de preparação de uma prova para a mensagem do formulário. */
export function avaliarPreparacao(
  dataProvaIso: string,
  distancia: DistanciaProva,
  distanciaKm?: number | null,
  hoje: Date = new Date(),
): AvaliacaoPreparacao {
  const minimas = minimoSemanas(distancia, distanciaKm);
  const inicio = subWeeks(parseISO(dataProvaIso), minimas);
  return {
    semanasMinimas: minimas,
    semanasFaltando: semanasFaltando(dataProvaIso, hoje),
    inicioPreparacao: inicio,
    preparacaoCurta: differenceInCalendarDays(inicio, startOfDay(hoje)) < 0,
  };
}
