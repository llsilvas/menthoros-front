export type ReconciliationStatus =
  | 'AMBIGUO'
  | 'NAO_PLANEJADO'
  | 'VINCULADO_AUTOMATICO'
  | 'VINCULADO_MANUALMENTE';

export type ReconciliationAction =
  | 'VINCULAR_MANUALMENTE'
  | 'MARCAR_NAO_PLANEJADO'
  | 'DESFAZER_VINCULO';

export interface PendingActivityReview {
  id: string;
  externalId: string;
  atletaId: string;
  atletaNome: string;
  dataTreino: string;
  tipoTreino: string;
  distanciaKm: number | null;
  duracaoMin: number | null;
  reconciliationStatus: ReconciliationStatus;
  reconciliationScore: number | null;
  fonteDados: string;
  isExpanded?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

export interface CandidateMatch {
  treinoPlanejadoId: string;
  data: string;
  tipoTreino: string;
  distanciaKm: number | null;
  duracaoMin: number | null;
  score: number;
  scoreBreakdown: {
    scoreTemporal: number;
    scoreDuracao: number;
    scoreDistancia: number;
  };
}

export interface ReconciliacaoAcaoRequest {
  action: ReconciliationAction;
  treinoPlanejadoId?: string;
}

export interface PendentesPage {
  content: PendingActivityReview[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
