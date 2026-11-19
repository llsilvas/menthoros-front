import type { DistanciaProvaObj } from './Prova';

/** Fases da temporada (`TrainingPhase` no backend). */
export type TrainingPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'RACE_WEEK';

/** Ciclo de vida da temporada (`SeasonPlanStatus` no backend). */
export type SeasonPlanStatus = 'PROPOSED' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface SeasonWeek {
    weekIndex: number;
    /** Segunda-feira da semana (yyyy-MM-dd). */
    weekStart: string;
    phase: TrainingPhase;
    targetVolumeKm: number;
    targetTss: number;
    deload: boolean;
    longRunKm?: number;
    valueSource: 'ENGINE' | 'COACH' | 'AI_ACCEPTED';
}

/** Prova preparatória ancorada numa semana (`SeasonPlanResponseDto.Milestone`). */
export interface SeasonMilestone {
    weekIndex: number;
    provaId: string;
    name: string;
    /** yyyy-MM-dd */
    date: string;
    distance: DistanciaProvaObj;
}

/** Regras do `SeasonPlanValidator` no backend. */
export type SeasonValidationRule = 'RAMP' | 'LONG_RUN_SHARE' | 'DELOAD_CADENCE' | 'TAPER_DEPTH';

/** Alerta brando da temporada; não bloqueia a aprovação. */
export interface SeasonValidation {
    rule: SeasonValidationRule;
    severity: 'WARN';
    weekIndex: number;
    measured: number;
    limit: number;
    message: string;
}

/** `SeasonPlanResponseDto` — temporada até a prova-alvo. */
export interface SeasonPlan {
    id: string;
    seasonStatus: SeasonPlanStatus;
    provaId: string;
    provaNome: string;
    provaData: string;
    shortPreparation: boolean;
    totalWeeks: number;
    initialCtl: number;
    peakVolumeKm: number;
    weeks: SeasonWeek[];
    milestones: SeasonMilestone[];
    validations: SeasonValidation[];
}
