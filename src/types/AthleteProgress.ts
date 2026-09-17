// Tipos de domínio da tela de Progresso do atleta.
// Espelham PmcPontoDto/ZonaDistribuicaoDto/RecordeDto/AderenciasSemanalDto do backend
// (GET /me/metricas/historico, /me/metricas/zonas, /me/recordes, /me/aderencia).

import type { PmcPontoRaw } from './AtletaPerfilCoach';

/** Ponto PMC — mesmo formato já consumido pelo perfil do atleta visto pelo coach. */
export type AthletePmc = PmcPontoRaw;

/** Distribuição de tempo por zona de FC (z1–z5), em segundos — conversão para % é feita na UI. */
export interface AthleteZones {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  duracaoTotalSegundos: number;
}

/** Recorde pessoal (PR) do atleta por distância de referência. */
export interface AthleteRecord {
  distancia: string;
  tempoSegundos: number;
  data: string; // ISO date
  treinoRealizadoId: string;
}

/** Aderência semanal ao plano (planejado x realizado) de uma semana. */
export interface AthleteAderencia {
  semanaInicio: string; // ISO date (segunda-feira)
  totalPlanejado: number;
  totalRealizado: number;
  percentual: number;
}

/** Janela de tempo pro cálculo de melhores esforços — mesma sintaxe de curva do intervals.icu. */
export type MelhoresEsforcosJanela = '42d' | '1y' | 'all';

/**
 * Melhor tempo contínuo por distância de referência (400m-10k) — diferente de {@link AthleteRecord}
 * (PR de treino inteiro): distâncias curtas acontecem dentro de um treino maior.
 */
export interface AthleteMelhorEsforco {
  distanciaLabel: string;
  distanciaMetros: number;
  tempoSegundos: number;
  paceLabel: string;
}

/** Resposta de GET /me/melhores-esforcos — integracaoConectada=false não é erro, é estado válido. */
export interface AthleteMelhoresEsforcos {
  marcas: AthleteMelhorEsforco[];
  integracaoConectada: boolean;
}
