export type TipoTreino =
    | 'CONTINUO'
    | 'INTERVALADO'
    | 'FARTLEK'
    | 'REGENERATIVO'
    | 'TREINO_LONGO'
    | 'HILL_REPEAT'
    | 'STRIDES'
    | 'TRAIL';

export const TIPO_TREINO_LABELS: Record<TipoTreino, string> = {
    CONTINUO:     'Corrida contínua',
    INTERVALADO:  'Intervalado',
    FARTLEK:      'Fartlek',
    REGENERATIVO: 'Regenerativo',
    TREINO_LONGO: 'Treino longo',
    HILL_REPEAT:  'Subidas (hill repeat)',
    STRIDES:      'Strides',
    TRAIL:        'Trail',
};

/** Corpo enviado para POST /api/v1/atletas/me/treinos */
export interface TreinoManualInput {
    tipo: TipoTreino;
    data: string;                 // ISO: YYYY-MM-DD
    duracaoMinutos: number;
    distanciaKm?: number;
    percepcaoEsforco: number;     // 1–10
    observacoes?: string;
}

/** Resposta retornada pelo backend (campos relevantes para o atleta) */
export interface TreinoRealizadoDto {
    id: string;
    dataTreino: string;           // ISO: YYYY-MM-DD
    tipoTreino: TipoTreino;
    duracaoMin: string;           // formato "HH:MM:SS" ou "MM:SS"
    distanciaKm?: number;
    percepcaoEsforco?: number;
    tssCalculado?: number;
    fonteDados: { value: string; label: string };
    status: { value: string; label: string };
    observacao?: string;
}
