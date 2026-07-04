// Tipos de domínio do check-in diário de prontidão do atleta.
// Espelham CheckinProntidaoInputDto/CheckinProntidaoOutputDto do backend
// (POST /api/v1/checkins, GET /api/v1/checkins/{atletaId}/atual).

export type NivelProntidao = 'PRONTO' | 'CAUTELOSO' | 'DESCANSAR';

export interface CheckinProntidaoInput {
  data?: string; // ISO date; default hoje no backend quando omitido
  qualidadeSono: number; // 1–10
  humor: number; // 1–10
  doresMusculares: number; // 0–10
  nivelEnergia: number; // 1–10
  estresse: number; // 0–10
  observacoes?: string;
}

export interface CheckinProntidaoOutput {
  id: string;
  atletaId: string;
  data: string; // ISO date
  qualidadeSono: number;
  humor: number;
  doresMusculares: number;
  nivelEnergia: number;
  estresse: number;
  observacoes?: string;
  readinessScore: number; // 0–1
  nivelProntidao: NivelProntidao;
}
