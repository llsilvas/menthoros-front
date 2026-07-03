// Tipos de domínio das telas Home/Readiness do atleta.
// Espelham AtletaHomeDto e ReadinessDto do backend (GET /me/home, /me/readiness).
// Todos os campos são opcionais: o backend usa @JsonInclude(NON_NULL) e os records
// aninhados podem vir ausentes (atleta sem próximo treino / sem métricas / sem sinais).

export interface AthleteProximoTreino {
  data?: string; // ISO date, ex.: "2026-06-18"
  tipoTreino?: string; // enum name do backend, ex.: "INTERVALADO"
  descricao?: string;
}

export interface AthleteMetricasChave {
  ctl?: number;
  atl?: number;
  tsb?: number;
  tss?: number;
  volumeKm?: number; // BigDecimal no backend → number no JSON
  statusForma?: string; // FaixaTsb resolvida pelo backend
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
