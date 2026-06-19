import type { RecommendationExplanation } from './Coach';

/** Tipo de sugestão gerada pelo job diário. */
export type SugestaoTipo = 'PLAN_ADJUST' | 'RECOVERY' | 'NEW_PLAN';

/** Status da sugestão no workflow do coach. */
export type SugestaoStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Nível de confiança da sugestão (espelha ExplanationConfidence do backend). */
export type SugestaoConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** Sugestão de IA persistida para revisão do coach (`GET /api/v1/coach/sugestoes`). */
export interface SugestaoCoachOutputDto {
    id: string;
    atletaId: string;
    athleteName: string;
    tipo: SugestaoTipo;
    status: SugestaoStatus;
    confidence: SugestaoConfidence;
    summary: string;
    reasoning?: RecommendationExplanation;
    /** ISO 8601 Instant serializado como string. */
    createdAt: string;
    /** Preenchido após aprovação ou rejeição. */
    reviewedAt?: string;
    /** Null = sem expiração; job preenche com createdAt + 7 dias. */
    expiresAt?: string;
}
