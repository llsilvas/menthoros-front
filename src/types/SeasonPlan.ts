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
}
