import type { EtapaRealizadaDetalhe, TempoEmZonasDto } from './TreinoRealizado';

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

/**
 * Trajeto GPS simplificado (`GET /me/realizados/{id}/trajeto`). Arrays paralelos: o i-ésimo ponto
 * da polyline tem `tSeg[i]` e `fc[i]`. Dado de dispositivo Garmin: exibir "Garmin {deviceName}".
 */
export interface GpsTrace {
    v: number;
    n: number;
    /** Encoded polyline (Google, precisão 5). */
    polyline: string;
    /** Segundos desde o primeiro ponto. */
    tSeg: number[];
    /** FC por ponto em bpm; null onde o sensor não registrou. */
    fc: Array<number | null>;
    deviceName?: string | null;
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
    /** Modelo do dispositivo (Garmin); ausente quando desconhecido. */
    deviceName?: string | null;
    /** Se há trajeto GPS em `GET /me/realizados/{id}/trajeto` (add-activity-gps-trace). */
    temTrajeto?: boolean;
    /** Corrida na esteira, só com evidência da fonte (add-activity-treadmill-flag). */
    esteira?: boolean;
    status: { value: string; label: string };
    observacao?: string;
    fcMedia?: number;
    /** Presente apenas em treinos com etapas detalhadas (ex.: voltas de um .fit). */
    etapasRealizadas?: EtapaRealizadaDetalhe[];
    /** Tempo em cada zona de FC; ausente sem amostras de FC ou sem zonas confiáveis. */
    tempoEmZonas?: TempoEmZonasDto;
}
