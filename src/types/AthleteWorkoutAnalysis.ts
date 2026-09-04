/**
 * Análise pós-treino na visão do ATLETA — contrato de
 * `GET /api/v1/atletas/me/realizados/{id}/analise` (analise-ia-treino-atleta, D4).
 *
 * `PENDING` vale por elegibilidade: o backend devolve 200 PENDING mesmo antes de a linha de
 * análise existir (janela do processamento assíncrono logo após o registro). O contrato nunca
 * traz os campos técnicos do coach (interpretação, causa, score, tags).
 */
export type AthleteAnalysisStatus = 'PENDING' | 'COMPLETED';

export interface AthleteAnalysisExecutado {
    duracaoMin?: number;
    distanciaKm?: number;
    rpe?: number;
}

export interface AthleteAnalysisPlanejado {
    duracaoMin?: number;
    distanciaKm?: number;
    rpeEsperado?: number;
}

export interface AthleteWorkoutAnalysis {
    status: AthleteAnalysisStatus;
    analyzedAt?: string;
    reconhecimento?: string;
    comoFoi?: string;
    esforco?: string;
    proximoTreino?: string;
    executado: AthleteAnalysisExecutado;
    /** Ausente quando o realizado não tem treino planejado vinculado. */
    planejado?: AthleteAnalysisPlanejado;
}
