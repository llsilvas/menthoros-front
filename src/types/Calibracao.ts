// Tipos de domínio do status de calibração do atleta.
// Espelha CalibracaoStatusOutputDto do backend (GET /api/v1/atletas/{atletaId}/calibracao).

/** Fase de periodização — sempre CALIBRATION quando o endpoint retorna algo (senão, 204). */
export type TrainingPhase = 'CALIBRATION';
export type CalibrationStage = 'OBSERVATION' | 'CALIBRATION' | 'STABILIZATION';

export const CALIBRATION_STAGE_LABELS: Record<CalibrationStage, string> = {
    OBSERVATION: 'Observação',
    CALIBRATION: 'Calibração',
    STABILIZATION: 'Estabilização',
};

export interface CalibrationStatus {
    phase: TrainingPhase;
    stage: CalibrationStage;
    weekNumber: number;
    confidenceScore: number;
}
