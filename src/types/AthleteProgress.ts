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

/** Campos mínimos de um treino recente usados para o KPI de volume (soma de distanciaKm). */
export interface AthleteTreinoRecente {
  dataTreino: string;
  distanciaKm?: number | null;
}
