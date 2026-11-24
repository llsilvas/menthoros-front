import type { DistanciaProvaObj } from './Prova';

/** Fases da temporada (`TrainingPhase` no backend). */
export type TrainingPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'RACE_WEEK';

/** Nome da fase para o treinador e para o atleta (o `PhaseIndicator` não tem PEAK nem RACE_WEEK). */
export const TRAINING_PHASE_LABEL: Record<TrainingPhase, string> = {
    BASE: 'Base',
    BUILD: 'Construção',
    PEAK: 'Pico',
    TAPER: 'Polimento',
    RACE_WEEK: 'Semana da prova',
};

/** Fases que o treinador pode escolher no ajuste (RACE_WEEK é só da semana da prova, travada). */
export const EDITABLE_PHASES: EditablePhase[] = ['BASE', 'BUILD', 'PEAK', 'TAPER'];

/** Por que a semana é somente leitura no ajuste (`SeasonWeekLock.Reason` no backend). */
export type SeasonWeekLockReason = 'COMPLETED' | 'IN_PROGRESS' | 'RACE_WEEK';

export const SEASON_WEEK_LOCK_LABEL: Record<SeasonWeekLockReason, string> = {
    COMPLETED: 'Concluída',
    IN_PROGRESS: 'Em andamento',
    RACE_WEEK: 'Semana da prova',
};

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
    /** Sessões-chave da semana, texto do treinador. */
    keySessions?: string;
    /** Somente leitura no ajuste (concluída, em andamento ou da prova). */
    locked: boolean;
    lockReason?: SeasonWeekLockReason;
}

/** Edição de uma semana do ajuste (`SeasonWeekUpdateInputDto`); campo ausente não muda, `keySessions: ''` limpa. */
export interface SeasonWeekUpdate {
    phase?: TrainingPhase;
    targetTss?: number;
    targetVolumeKm?: number;
    longRunKm?: number;
    deload?: boolean;
    keySessions?: string;
}

/** Fases que o recálculo distribui; a semana da prova é sempre 1. */
export type EditablePhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';

/** Parâmetros do recálculo do ajuste (`SeasonPlanRecalculateInputDto`). */
export interface SeasonPlanRecalculate {
    phaseWeeks: Record<EditablePhase, number>;
    startVolumeKm: number;
}

/** Campo comparado no diff do ajuste (`SeasonPlanDiff.CAMPOS` no backend). */
export type SeasonDiffField = 'phase' | 'targetVolumeKm' | 'targetTss' | 'longRunKm' | 'deload' | 'keySessions';

/** Campo alterado do rascunho em relação à temporada ativa (`SeasonPlanDiffDto`). */
export interface SeasonPlanDiffEntry {
    weekIndex: number;
    field: SeasonDiffField;
    /** Valor na ativa; `null` quando a ativa não tinha valor. */
    before: string | number | boolean | null;
    after: string | number | boolean | null;
    source: SeasonWeek['valueSource'];
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
    /** Instante da aprovação (ISO); ausente enquanto PROPOSED. */
    approvedAt?: string;
    provaId: string;
    provaNome: string;
    provaData: string;
    shortPreparation: boolean;
    totalWeeks: number;
    initialCtl: number;
    /** Volume de partida (km) da geração ou do último recálculo; ausente em temporadas anteriores à V121. */
    initialVolumeKm?: number;
    peakVolumeKm: number;
    weeks: SeasonWeek[];
    milestones: SeasonMilestone[];
    validations: SeasonValidation[];
    /** 1 na proposta original, +1 a cada ajuste aprovado. */
    version?: number;
    /** Temporada ACTIVE da qual este ajuste foi copiado; ausente na versão 1. */
    baseSeasonPlanId?: string;
    /** Ajuste aberto a partir desta temporada ACTIVE. */
    openDraftId?: string;
}

/** `AthleteSeasonPlanDto` — temporada aprovada vista pelo atleta, sem validações nem dados do treinador. */
export interface AthleteSeasonPlan {
    raceName: string;
    /** yyyy-MM-dd */
    raceDate: string;
    distance: DistanciaProvaObj;
    daysToRace: number;
    /** Ausente fora do horizonte da temporada. */
    currentPhase?: TrainingPhase;
    upcomingMilestones: Array<{ name: string; date: string; distance: DistanciaProvaObj }>;
}
