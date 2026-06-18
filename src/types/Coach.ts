/**
 * Tipos de domínio dos dashboards do coach (contrato de `/api/v1/coach/**`).
 * Campos anuláveis no backend (`@JsonInclude(NON_NULL)`) são opcionais aqui.
 */

/** Status de atenção do coach derivado no backend (`deriveStatus`). */
export type CoachAtletaStatus = 'active' | 'warning' | 'danger' | 'paused';

/** Atleta no roster do coach (`GET /api/v1/coach/atletas`). */
export interface CoachAtletaResumo {
    atletaId: string;
    nome: string;
    /** CTL (fitness); ausente quando sem métricas. */
    ctl?: number;
    /** ATL (fadiga); ausente quando sem métricas. */
    atl?: number;
    /** TSB (forma); ausente quando sem métricas. */
    tsb?: number;
    /** Fase de periodização; ausente quando sem plano. */
    fase?: string;
    status: CoachAtletaStatus;
    /** Data do último treino (ISO `yyyy-MM-dd`); ausente se nenhum. */
    lastActivity?: string;
    /** Volume realizado na semana atual (km). */
    weeklyVolume: number;
}

/** Treino planejado no calendário do coach. */
export interface TreinoAgendado {
    atletaId?: string;
    nomeAtleta?: string;
    /** Data do treino (ISO `yyyy-MM-dd`). */
    data: string;
    /** Tipo do treino (enum backend, ex.: `INTERVALADO`). */
    tipoTreino?: string;
    isKeyWorkout: boolean;
    hasAlert: boolean;
    hasPendingSuggestion: boolean;
}

/** Calendário semanal do coach (`GET /api/v1/coach/calendario-semanal`). */
export interface CoachCalendario {
    /** Início da semana (segunda, ISO `yyyy-MM-dd`). */
    semanaInicio: string;
    /** Fim da semana (domingo, ISO `yyyy-MM-dd`). */
    semanaFim: string;
    treinos: TreinoAgendado[];
}

/** KPIs consolidados do tenant. */
export interface CoachKpis {
    totalAtletas: number;
    ativos: number;
    emAtencao: number;
    pausados: number;
    treinosPlanejadosSemana: number;
}

/** Carga agregada de uma semana (tendência). */
export interface PontoCargaSemanal {
    /** Semana ISO (ex.: `2026-W25`). */
    semana: string;
    volumeTotalKm: number;
    tssTotal: number;
}

/** Atleta no ranking de volume do período. */
export interface TopAtleta {
    atletaId: string;
    nome: string;
    volumeKm: number;
}

/** Insights agregados do coach (`GET /api/v1/coach/insights`). */
export interface CoachInsights {
    kpis: CoachKpis;
    tendenciaCargaSemanal: PontoCargaSemanal[];
    topAtletas: TopAtleta[];
}
