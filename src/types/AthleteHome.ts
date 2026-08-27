// Tipos de domínio das telas Home/Readiness do atleta.
// Espelham AtletaHomeDto e ReadinessDto do backend (GET /me/home, /me/readiness).
// Todos os campos são opcionais: o backend usa @JsonInclude(NON_NULL) e os records
// aninhados podem vir ausentes (atleta sem próximo treino / sem métricas / sem sinais).

import type { FaixaTsbStatus } from './FaixaTsb';
import type { EtapaTreino } from './TreinoPlanejado';

export interface AthleteProximoTreino {
  data?: string; // ISO date, ex.: "2026-06-18"
  tipoTreino?: string; // enum name do backend, ex.: "INTERVALADO"
  descricao?: string;
  /** Minutos inteiros (o backend converte de `Duration`); ausente quando não prescrita. */
  duracaoMin?: number;
  zonaAlvo?: string;
  tssPlanejado?: number;
  intensidadePlanejada?: number;
  /** Mesmo `EtapaTreinoDto` do detalhe do coach (com `blocoId`/`blocoRepeticoes`); ausente sem etapas. */
  etapas?: EtapaTreino[];
}

export interface AthleteMetricasChave {
  ctl?: number;
  atl?: number;
  tsb?: number;
  tss?: number;
  volumeKm?: number; // BigDecimal no backend → number no JSON
  statusForma?: FaixaTsbStatus; // FaixaTsb resolvida pelo backend
}

export interface AthleteHome {
  proximoTreino?: AthleteProximoTreino;
  metricasChave?: AthleteMetricasChave;
}

export interface AthleteReadinessFatores {
  tsbProntidao?: number;
  ctl?: number;
  atl?: number;
  ultimoRpe?: number;
}

export interface AthleteReadiness {
  score?: number; // 0–100; null quando sem sinais suficientes
  classificacao?: string;
  fatores?: AthleteReadinessFatores;
  nota?: string;
}
