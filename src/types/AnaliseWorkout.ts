export type AnaliseStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type PrimaryAnalysisCause =
    | 'ACCUMULATED_FATIGUE'
    | 'CNS_FATIGUE'
    | 'ENVIRONMENTAL_FACTORS'
    | 'NORMAL'
    | 'PACING_ERROR'
    | 'UNDERTRAINING';

export const PRIMARY_CAUSE_LABEL: Record<PrimaryAnalysisCause, string> = {
    ACCUMULATED_FATIGUE: 'Fadiga Acumulada',
    CNS_FATIGUE: 'Fadiga do SNC',
    ENVIRONMENTAL_FACTORS: 'Fatores Ambientais',
    NORMAL: 'Execução Normal',
    PACING_ERROR: 'Erro de Ritmo',
    UNDERTRAINING: 'Subtreino',
};

export interface AnaliseWorkout {
    id: string;
    treinoRealizadoId: string;
    status: AnaliseStatus;
    summary?: string;
    technicalInterpretation?: string;
    primaryCause?: PrimaryAnalysisCause;
    recommendation?: string;
    tags?: string[];
    executionScore?: number;
    rationale?: string;
    analyzedAt?: string;
}
