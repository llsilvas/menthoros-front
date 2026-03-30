// Enum keys (usados no envio ao backend)
export type TipoProva = 'CORRIDA_RUA' | 'TRAIL' | 'MEIA' | 'MARATONA';
export type DistanciaProva = 'KM_5' | 'KM_10' | 'KM_21' | 'KM_42';
export type ProvaStatus = 'PLANEJADA' | 'CONFIRMADA' | 'CONCLUIDA' | 'CANCELADA';

export interface TipoProvaObj {
    value: string;
    label: string;
    description: string;
    color: string;
    distance: string;
}

export const TIPO_PROVA_LABELS: Record<TipoProva, string> = {
    CORRIDA_RUA: 'Corrida de Rua',
    TRAIL: 'Trail Running',
    MEIA: 'Meia Maratona',
    MARATONA: 'Maratona',
};

export const extractTipoKey = (value: unknown): TipoProva | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value as TipoProva;
    if (typeof value === 'object' && value !== null && 'value' in value) {
        return (value as TipoProvaObj).value as TipoProva;
    }
    return undefined;
};

// Objeto serializado pelo backend (@JsonFormat OBJECT)
export interface DistanciaProvaObj {
    value: string;
    label: string;
    short: string;
    order: number;
}

export interface ProvaStatusObj {
    value: string;
    label: string;
    description: string;
    color: string;
    active: boolean;
}

export const DISTANCIA_PROVA_LABELS: Record<DistanciaProva, string> = {
    KM_5: '5 km',
    KM_10: '10 km',
    KM_21: '21 km (Meia Maratona)',
    KM_42: '42 km (Maratona)',
};

export const PROVA_STATUS_LABELS: Record<ProvaStatus, string> = {
    PLANEJADA: 'Planejada',
    CONFIRMADA: 'Confirmada',
    CONCLUIDA: 'Concluída',
    CANCELADA: 'Cancelada',
};

export const PROVA_STATUS_COLORS: Record<ProvaStatus, string> = {
    PLANEJADA: '#9E9E9E',
    CONFIRMADA: '#2196F3',
    CONCLUIDA: '#4CAF50',
    CANCELADA: '#F44336',
};

// Extrai o key do enum de um valor que pode vir como string ou como objeto serializado
export const extractDistanciaKey = (value: unknown): DistanciaProva | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value as DistanciaProva;
    if (typeof value === 'object' && value !== null && 'value' in value) {
        const v = (value as DistanciaProvaObj).value;
        const map: Record<string, DistanciaProva> = { '5K': 'KM_5', '10K': 'KM_10', '21K': 'KM_21', '42K': 'KM_42' };
        return map[v];
    }
    return undefined;
};

export const extractStatusKey = (value: unknown): ProvaStatus | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value as ProvaStatus;
    if (typeof value === 'object' && value !== null && 'value' in value) {
        return (value as ProvaStatusObj).value as ProvaStatus;
    }
    return undefined;
};

// Output DTO (recebido do backend — enums podem vir como objetos)
export interface Prova {
    id: string;
    nomeProva: string;
    dataProva: string;
    tipoProva: TipoProva | TipoProvaObj;
    distancia: DistanciaProva | DistanciaProvaObj;
    distanciaKm?: number;
    provaAlvo?: boolean;
    statusProva?: ProvaStatus | ProvaStatusObj;
    tempoObjetivo?: string;    // HH:mm:ss
    paceObjetivo?: number;
    tsbIdealProva?: number;
    foiRealizada?: boolean;
    tempoRealizado?: string;   // HH:mm:ss
    posicaoGeral?: number;
    posicaoCategoria?: number;
    tssProva?: number;
    percepcaoEsforcoProva?: number;
    feedbackProva?: string;
    semanasPreparacao?: number;
    inicioPreparacao?: string;
    diasFaltando?: number;     // campo computado, apenas na saída
}

// Input DTO (enviado ao backend — enums como string key)
export interface CreateProva {
    nomeProva: string;
    dataProva: string;
    tipoProva: TipoProva;
    distancia: DistanciaProva;
    distanciaKm?: number;
    provaAlvo?: boolean;
    statusProva?: ProvaStatus;
    tempoObjetivo?: string;
    paceObjetivo?: number;
    tsbIdealProva?: number;
    foiRealizada?: boolean;
    tempoRealizado?: string;
    posicaoGeral?: number;
    posicaoCategoria?: number;
    tssProva?: number;
    percepcaoEsforcoProva?: number;
    feedbackProva?: string;
    semanasPreparacao?: number;
    inicioPreparacao?: string;
}

export interface UpdateProva extends Partial<CreateProva> {
    id: string;
}
