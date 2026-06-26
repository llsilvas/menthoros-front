export type DecisionState = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SegmentFilter = 'all' | 'attention' | 'drop' | 'stable' | 'growth';
export type PlanStatus = 'ATRASADO' | 'NO_PRAZO' | 'CONCLUIDO';
export type TrainingType = 'Corrida' | 'Força' | 'Mobilidade' | 'Descanso';

export interface RaceItem {
  date: string;
  label: string;
  tag: 'ALVO' | 'PRINCIPAL' | 'SECUNDÁRIA';
}

export interface CoachAthleteRow {
  id: string;
  name: string;
  discipline: string;
  age: number;
  nivelExperiencia: string | null;
  gender: string;
  weeksOnPlan: number;
  segment: SegmentFilter;
  planStatus: PlanStatus;
  trainingType: TrainingType;
  statusLabel: string;
  decision: DecisionState;
  adherence: number;
  load7d: number;
  loadDelta: number;
  delay: number;
  nextWorkout: {
    title: string;
    when: string;
    zone: string;
    duration: string;
    distance: string;
    objective: string;
  };
  raceCalendar: RaceItem[];
  loadTrend: number[];
  adherenceTrend: number[];
  notes: string;
  suggestedActions: string[];
  quickStats: {
    acuteLoad: number;
    monotony: number;
    tsb: number | null;
    acwr: number | null;
    /** % de aderência da semana mais recente — NÃO é recuperação fisiológica (TSB). Ver follow-up de semântica. */
    recovery: number;
  };
}
