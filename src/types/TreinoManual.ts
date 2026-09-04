export type TipoTreino =
    | 'CONTINUO'
    | 'INTERVALADO'
    | 'FARTLEK'
    | 'REGENERATIVO'
    | 'TREINO_LONGO'
    | 'HILL_REPEAT'
    | 'STRIDES'
    | 'TRAIL'
    | 'PROVA';

export const TIPO_TREINO_LABELS: Record<TipoTreino, string> = {
    CONTINUO:     'Corrida contínua',
    INTERVALADO:  'Intervalado',
    FARTLEK:      'Fartlek',
    REGENERATIVO: 'Regenerativo',
    TREINO_LONGO: 'Treino longo',
    HILL_REPEAT:  'Subidas (hill repeat)',
    STRIDES:      'Strides',
    TRAIL:        'Trail',
    // prova-no-plano-semanal, 5.4: o seletor do registro manual é fechado (enum), então PROVA
    // precisa entrar aqui para o atleta poder registrar a execução da prova.
    PROVA:        'Prova',
};

/** Corpo enviado para POST /api/v1/atletas/me/treinos */
export interface TreinoManualInput {
    tipo: TipoTreino;
    data: string;                 // ISO: YYYY-MM-DD
    duracaoMinutos: number;
    distanciaKm?: number;
    percepcaoEsforco: number;     // 1–10
    observacoes?: string;
    /**
     * Sinais extras coletados durante TrainingPhase.CALIBRATION (task 8.3/8.4,
     * athlete-onboarding-baseline) — omitidos fora da calibração. Escala 1–10, mesmo padrão do RPE.
     */
    nivelDor?: number;
    nivelFadiga?: number;
    qualidadeSonoNoiteAnterior?: number;
    nivelRecuperacao?: number;
}

/** Subconjunto de `TreinoManualInput` só com os 4 sinais extras de calibração (task 8.3/8.4). */
export interface CalibracaoExtras {
    nivelDor: number;
    nivelFadiga: number;
    qualidadeSonoNoiteAnterior: number;
    nivelRecuperacao: number;
}

export const CALIBRACAO_EXTRAS_DEFAULT: CalibracaoExtras = {
    nivelDor: 1,
    nivelFadiga: 5,
    qualidadeSonoNoiteAnterior: 5,
    nivelRecuperacao: 5,
};

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
    fcMedia?: number;
    /** Presente apenas em treinos com etapas detalhadas (ex.: importados de .fit) */
    etapasRealizadas?: unknown[];
}
