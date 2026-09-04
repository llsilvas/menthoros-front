import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';
import { rpeLabel } from '../../../types/Rpe';
import { effortColor } from '../../../shared/theme/workoutColors';
import { formatKm } from '../../../utils/formatKm';

export type WorkoutAnalysisViewStatus = 'pending' | 'done';

export interface WorkoutAnalysisStat {
    label: string;
    value: string;
    /** "plano 61 min" / "esperado 6/10" — ausente quando não há planejado. */
    sub?: string;
    /** Cor do valor (esforço via `effortColor`); demais stats usam a cor padrão. */
    valueColor?: string;
}

export interface WorkoutAnalysisView {
    status: WorkoutAnalysisViewStatus;
    reconhecimento?: string;
    comoFoi?: string;
    esforco?: string;
    proximoTreino?: string;
    /** "RPE 7/10 · Difícil" para o chip do drawer; ausente sem RPE. */
    rpeChipLabel?: string;
    stats: WorkoutAnalysisStat[];
}

/**
 * Transforma o contrato do endpoint no view model do `WorkoutAnalysisCard` (design D5).
 * Puro: sem hooks, sem estado — testável com `*.test.ts` simples.
 */
export function buildWorkoutAnalysisView(dto: AthleteWorkoutAnalysis): WorkoutAnalysisView {
    const stats: WorkoutAnalysisStat[] = [];
    const { executado, planejado } = dto;

    if (executado.duracaoMin != null) {
        stats.push({
            label: 'Duração',
            value: `${executado.duracaoMin} min`,
            sub: planejado?.duracaoMin != null ? `plano ${planejado.duracaoMin} min` : undefined,
        });
    }
    if (executado.distanciaKm != null) {
        stats.push({
            label: 'Distância',
            value: `${formatKm(executado.distanciaKm)} km`,
            sub: planejado?.distanciaKm != null ? `plano ${formatKm(planejado.distanciaKm)} km` : undefined,
        });
    }
    if (executado.rpe != null) {
        stats.push({
            label: 'Esforço',
            value: `${executado.rpe}/10`,
            sub: planejado?.rpeEsperado != null ? `esperado ${planejado.rpeEsperado}/10` : undefined,
            valueColor: effortColor(executado.rpe),
        });
    }

    return {
        status: dto.status === 'COMPLETED' ? 'done' : 'pending',
        reconhecimento: dto.reconhecimento,
        comoFoi: dto.comoFoi,
        esforco: dto.esforco,
        proximoTreino: dto.proximoTreino,
        rpeChipLabel: executado.rpe != null
            ? `RPE ${executado.rpe}/10 · ${rpeLabel(executado.rpe)}`
            : undefined,
        stats,
    };
}
