import type { AthleteWorkoutAnalysis } from '../../../types/AthleteWorkoutAnalysis';
import { rpeLabel } from '../../../types/Rpe';
import { effortColor } from '../../../shared/theme/workoutColors';
import { formatKm } from '../../../utils/formatKm';

export type WorkoutAnalysisViewStatus = 'pending' | 'done';

export interface WorkoutAnalysisMetricItem {
    key: 'duracao' | 'distancia' | 'rpe';
    /** "58 min" / "11,2 km" / "RPE 7/10" — já formatado com unidade. */
    text: string;
    /** Presente só quando o item deve ter destaque de alerta (RPE acima do esperado). */
    color?: string;
}

export interface WorkoutAnalysisView {
    status: WorkoutAnalysisViewStatus;
    reconhecimento?: string;
    comoFoi?: string;
    esforco?: string;
    proximoTreino?: string;
    /** "RPE 7/10 · Difícil" para o chip do drawer; ausente sem RPE. */
    rpeChipLabel?: string;
    /** Linha única em mono: duração, distância e RPE do executado. */
    metrics: WorkoutAnalysisMetricItem[];
    /** "plano 61 min · 11,0 km · RPE esperado 6/10" — só quando algum número difere do plano. */
    planLine?: string;
}

/**
 * Transforma o contrato do endpoint no view model do `WorkoutAnalysisCard` (design D5,
 * refinado em refine-athlete-workout-analysis-card). Puro: sem hooks, sem estado —
 * testável com `*.test.ts` simples.
 */
export function buildWorkoutAnalysisView(dto: AthleteWorkoutAnalysis): WorkoutAnalysisView {
    const { executado, planejado } = dto;
    const metrics: WorkoutAnalysisMetricItem[] = [];
    const planParts: string[] = [];
    let algumDifere = false;

    if (executado.duracaoMin != null) {
        metrics.push({ key: 'duracao', text: `${executado.duracaoMin} min` });
        if (planejado?.duracaoMin != null) {
            planParts.push(`${planejado.duracaoMin} min`);
            if (planejado.duracaoMin !== executado.duracaoMin) algumDifere = true;
        }
    }
    if (executado.distanciaKm != null) {
        metrics.push({ key: 'distancia', text: `${formatKm(executado.distanciaKm)} km` });
        if (planejado?.distanciaKm != null) {
            planParts.push(`${formatKm(planejado.distanciaKm)} km`);
            if (planejado.distanciaKm !== executado.distanciaKm) algumDifere = true;
        }
    }
    if (executado.rpe != null) {
        const emAlerta = planejado?.rpeEsperado != null && executado.rpe > planejado.rpeEsperado;
        metrics.push({
            key: 'rpe',
            text: `RPE ${executado.rpe}/10`,
            color: emAlerta ? effortColor(executado.rpe) : undefined,
        });
        if (planejado?.rpeEsperado != null) {
            planParts.push(`RPE esperado ${planejado.rpeEsperado}/10`);
            if (planejado.rpeEsperado !== executado.rpe) algumDifere = true;
        }
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
        metrics,
        planLine: algumDifere && planParts.length > 0 ? `plano ${planParts.join(' · ')}` : undefined,
    };
}
