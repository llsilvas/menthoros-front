/**
 * Tipos de domínio dos dashboards do coach (contrato de `/api/v1/coach/**`).
 * Campos anuláveis no backend (`@JsonInclude(NON_NULL)`) são opcionais aqui.
 */
import type { FaixaTsbStatus } from './FaixaTsb';
import type { StatusVencimentoPlano, TipoPlanoAtleta } from './Atleta';

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
    /** Faixa de forma resolvida pelo backend a partir do TSB; ausente quando sem TSB. */
    statusForma?: FaixaTsbStatus;
    /** Fase de periodização; ausente quando sem plano. */
    fase?: string;
    status: CoachAtletaStatus;
    /** Data do último treino (ISO `yyyy-MM-dd`); ausente se nenhum. */
    lastActivity?: string;
    /** Volume realizado na semana atual (km). */
    weeklyVolume: number;
    /** Percentual de aderência das últimas 4 semanas (0–100); ausente quando sem plano. */
    aderenciaPercentual?: number;
    /** Tipo de plano do atleta com a assessoria; ausente quando não cadastrado. */
    tipoPlanoAtleta?: TipoPlanoAtleta;
    /** Data de vencimento do plano do atleta com a assessoria; ausente quando não cadastrado. */
    dataVencimentoPlano?: string;
    /** Status de vencimento derivado; ausente quando dataVencimentoPlano não cadastrada. */
    statusVencimentoPlano?: StatusVencimentoPlano;
}

/** Filtros do dashboard agregado do coach. */
export interface CoachDashboardQuery {
    q?: string;
    status?: CoachAtletaStatus;
    sortBy?: 'priority' | 'name' | 'volume' | 'tsb';
    page?: number;
    size?: number;
    from?: string;
    to?: string;
    weekFrom?: string;
}

/** Resumo operacional do dashboard agregado do coach. */
export interface CoachDashboardSummary {
    kpis: CoachKpis;
    atletasExibidos: number;
    itensFilaAtencao: number;
}

/** Página do roster usada pelo dashboard agregado do coach. */
export interface CoachDashboardRosterPage {
    items: CoachAtletaResumo[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

/** Resposta agregada do dashboard do coach. */
export interface CoachDashboard {
    generatedAt: string;
    summary: CoachDashboardSummary;
    roster: CoachDashboardRosterPage;
    attentionQueue: CoachAttentionItem[];
    calendar: CoachCalendario;
    insights: CoachInsights;
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

// ── Fila de atenção (`GET /api/v1/coach/attention-queue`) ─────────────────────

export type AttentionSeverity = 'CRITICA' | 'ALTA' | 'MEDIA';

export type AttentionReason =
    | 'FADIGA'
    | 'SOBRECARGA'
    | 'SEM_PLANO'
    | 'ADERENCIA'
    | 'INATIVIDADE'
    | 'ZONAS_VENCIDAS';

export type ExplanationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RecommendationExplanation {
    rationale: string;
    sourceRules: string[];
    confidence: ExplanationConfidence;
}

export interface AttentionEvidence {
    label: string;
    value: string;
}

/** Item da fila de atenção do coach (`GET /api/v1/coach/attention-queue`). */
export interface CoachAttentionItem {
    atletaId: string;
    athleteName: string;
    severity: AttentionSeverity;
    priorityScore: number;
    primaryReason: AttentionReason;
    suggestedAction: string;
    /** ISO 8601 Instant serializado como string. */
    generatedAt: string;
    evidence: AttentionEvidence[];
    explanation?: RecommendationExplanation;
}
