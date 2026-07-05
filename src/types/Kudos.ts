export type MotivoKudos = 'CONSISTENCIA' | 'MELHORA' | 'ESFORCO' | 'SUPERACAO' | 'VOLTA';

export interface KudosInput {
  motivo: MotivoKudos;
}

/** Retorno de `POST /api/v1/coach/atletas/{atletaId}/kudos`. */
export interface KudosOutput {
  id: string;
  atletaId: string;
  coachId: string;
  motivo: MotivoKudos;
  createdAt: string;
}

/** Retorno de `GET /api/v1/atletas/me/kudos/recentes` — sem coachId/atletaId (a UI não precisa). */
export interface KudosRecente {
  id: string;
  motivo: MotivoKudos;
  createdAt: string;
}
