import type { FormVariant } from './AthleteForm';
import type { FaixaTsbStatus } from '../../../types/FaixaTsb';
import type { CoachAtletaStatus } from '../../../types/Coach';

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
  /**
   * Status do atleta, cru. O `statusLabel` é a versão exibível dele; a COR do chip precisa vir da
   * mesma fonte, senão rótulo e cor divergem — foi o que aconteceu quando a cor vinha da decisão
   * do plano.
   */
  status: CoachAtletaStatus;
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
    /**
     * `false` quando não há série PMC na janela: as métricas abaixo são preenchidas com fallbacks
     * (0 km, monotonia 1.00) que a UI **não pode** exibir como medição — sem esta flag, um atleta
     * que nunca sincronizou aparece com carga "adequada".
     */
    hasWindowData: boolean;
    acuteLoad: number;
    monotony: number;
    tsb: number | null;
    /** Faixa de forma resolvida pelo backend (FaixaTsb); null quando sem TSB. */
    statusForma: FaixaTsbStatus | null;
    acwr: number | null;
    /** Training Strain = TSS_semanal × monotonia — qualidade do ciclo de treino. */
    strain: number | null;
    /** % de aderência da semana mais recente — NÃO é recuperação fisiológica (TSB). Ver follow-up de semântica. */
    recovery: number;
  };
  /** Forma prevista no dia da próxima prova (taper puro). null quando sem prova futura ou sem PMC. */
  racePrediction: {
    diasAteProva: number;
    tsbPrevisto: number;
    formaPrevista: FormVariant;
  } | null;
}
