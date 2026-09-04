// "Como foi?" pós-treino — espelha FeedbackTreinoInputDto (POST /me/realizados/{id}/feedback).

export type Sensacao = 'PERNAS_PESADAS' | 'RITMO_TRANQUILO' | 'CALOR' | 'DOR' | 'DORMI_MAL';

export const SENSACAO_LABELS: Record<Sensacao, string> = {
  PERNAS_PESADAS: 'Pernas pesadas',
  RITMO_TRANQUILO: 'Ritmo tranquilo',
  CALOR: 'Calor',
  DOR: 'Dor',
  DORMI_MAL: 'Dormi mal',
};

export interface FeedbackTreinoInput {
  percepcaoEsforco: number;
  sensacoes?: Sensacao[];
  comentario?: string;
}
