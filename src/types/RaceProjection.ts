export type ProjectionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type CtlTrend = 'BUILDING' | 'STABLE' | 'DECLINING';
export type GapAssessment = 'ON_TRACK' | 'REACHABLE' | 'STRETCH' | 'UNLIKELY';
export type PeriodizationPhase =
    | 'TAPER_OPTIMAL'
    | 'BUILD_PEAK'
    | 'ESPECIFICO_FRESH'
    | 'BASE_CONSERVATIVE'
    | 'FATIGUED'
    | 'OVERTAPERED';

export const PERIODIZATION_PHASE_LABELS: Record<PeriodizationPhase, string> = {
    TAPER_OPTIMAL: 'Taper Ótimo',
    BUILD_PEAK: 'Pico de Volume',
    ESPECIFICO_FRESH: 'Específico Recuperado',
    BASE_CONSERVATIVE: 'Base Conservadora',
    FATIGUED: 'Fatigado',
    OVERTAPERED: 'Taper Excessivo',
};

export const CONFIDENCE_LABELS: Record<ProjectionConfidence, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
};

export const GAP_ASSESSMENT_LABELS: Record<GapAssessment, string> = {
    ON_TRACK: 'No Caminho',
    REACHABLE: 'Alcançável',
    STRETCH: 'Desafiador',
    UNLIKELY: 'Improvável',
};

export const CTL_TREND_LABELS: Record<CtlTrend, string> = {
    BUILDING: 'Crescendo',
    STABLE: 'Estável',
    DECLINING: 'Declinando',
};

// Standard race distances in meters
export const TARGET_DISTANCES: { label: string; value: number }[] = [
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '21 km', value: 21097 },
    { label: '42 km', value: 42195 },
];

export const formatDistanceLabel = (meters: number): string => {
    if (meters === 5000) return '5 km';
    if (meters === 10000) return '10 km';
    if (meters === 21097) return '21 km';
    if (meters === 42195) return '42 km';
    return `${(meters / 1000).toFixed(1)} km`;
};

export const formatSeconds = (totalSec: number): string => {
    const sec = Math.round(totalSec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
};

export const formatPace = (secPerKm: number): string => {
    const sec = Math.round(secPerKm);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}/km`;
};

// ── Request types ──────────────────────────────────────────────────

export interface LoadProjectionData {
    currentCtl: number;
    currentAtl: number;
    currentTsb: number;
    targetRaceDate: string;   // YYYY-MM-DD
    weeksToRace: number;
    plannedPeriodizationPhase: PeriodizationPhase;
    projectedCtlOnRaceDay: number;
    projectedTsbOnRaceDay: number;
}

export interface CoachGoalData {
    goalTimeSeconds: number;
    targetDistanceM: number;
}

export interface GenerateRaceProjectionRequest {
    provaId?: string;
    targetDistances: number[];
    loadProjection: LoadProjectionData;
    coachGoalOverride?: CoachGoalData;
    weeksToRaceOverride?: number;
}

// ── Response types ─────────────────────────────────────────────────

export interface ProjectionDto {
    distanceM: number;
    projectedTimeSeconds: number;
    projectedPaceSecPerKm: number;
    timeRangeOptimisticSec: number;
    timeRangeConservativeSec: number;
    confidence: ProjectionConfidence;
    prPotential: boolean;
}

export interface CtlForecastDto {
    currentCtl: number;
    projectedCtlRaceDay: number;
    ctlTrend: CtlTrend;
    weeksToPeak?: number;
}

export interface GoalGapDto {
    goalTimeSeconds: number;
    projectedTimeSeconds: number;
    gapSeconds: number;
    gapPct: number;
    gapAssessment: GapAssessment;
    coachNoteGap: string;
}

// Coach snapshot (full view)
export interface RaceProjectionSnapshot {
    id: string;
    atletaId: string;
    provaId?: string;
    generatedAt: string;
    weeksToRace: number;
    confidence: ProjectionConfidence;
    isOfficial: boolean;
    coachReviewedAt?: string;
    projections: Record<string, ProjectionDto>;
    progressionNarrative: string;
    keyAssumptions: string[];
    coachNote?: string;
    ctlForecast?: CtlForecastDto;
    goalGapAnalysis?: GoalGapDto;
    regressionRSquared?: number;
    riegelExponentUsed?: number;
    riegelCalibrated?: boolean;
    weeksOfTrainingData?: number;
}

// Athlete view (simplified — no confidence numeric, no gap, no coachNote)
export interface AthleteProjectionView {
    provaId?: string;
    generatedAt: string;
    projections: Record<string, ProjectionSummary>;
    progressionNarrative: string;
    keyAssumptions: string[];
}

export interface ProjectionSummary {
    distanceM: number;
    projectedTimeSeconds: number;
    projectedPaceSecPerKm: number;
    prPotential: boolean;
}
