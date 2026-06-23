import type { PlanoStatus } from './PlanoSemanal';
export type { PlanoStatus };

/** Status de revisão do plano pelo coach — espelha `PlanoReviewStatus` do backend. */
export type PlanoReviewStatus = 'AGUARDANDO_REVISAO' | 'APROVADO' | 'REJEITADO';

/** Shape do enum PlanoReviewStatus serializado pelo backend com @JsonFormat(OBJECT). */
export interface PlanoReviewStatusDto {
    value: string;
    label: string;
    description?: string;
    color?: string;
    active?: boolean;
}

/** Extrai o valor string de um reviewStatus que pode chegar como string ou objeto. */
export function resolveReviewStatus(status: string | PlanoReviewStatusDto): PlanoReviewStatus {
    const raw = typeof status === 'string' ? status : status.value;
    return raw as PlanoReviewStatus;
}

/** Shape do enum DiaSemana serializado pelo backend com @JsonFormat(OBJECT). */
export interface DiaSemanaDto {
    value: string;
    label: string;
    short?: string;
    order?: number;
}

/** Etapa de um treino planejado — espelha `EtapaTreinoDto` do backend. */
export interface EtapaTreinoDto {
    ordem?: number;
    tipoEtapa: string;      // "AQUECIMENTO" | "PRINCIPAL" | "INTERVALADO" | "RECUPERACAO" | "DESAQUECIMENTO"
    descricaoEtapa?: string;
    duracaoMin?: number;    // inteiro em minutos
    distanciaKm?: number;
    fcAlvoEtapa?: string;   // zona alvo, e.g. "Z2"
    repeticoes?: number;
    blocoId?: string;
    blocoRepeticoes?: number;
}

/** Treino planejado resumido para exibição no painel de revisão. */
export interface TreinoPlanejadoDto {
    id?: string;
    dataTreino?: string;
    diaSemana: string | DiaSemanaDto;
    tipoTreino: string;
    distanciaKm: number;
    duracaoMin?: string;       // ISO-8601, e.g. "PT90M" ou "PT1H30M"
    zonaAlvo?: string;
    observacao?: string;
    justificativaIa?: string;
    tssPlanejado?: number;
    percepcaoEsforcoEsperada?: number;
    editadoPeloCoach?: boolean;
    adicionadoPeloCoach?: boolean;
    etapas?: EtapaTreinoDto[];
}

/** Payload para adicionar treino via POST /coach/planos/{planoId}/treinos. */
export interface TreinoPlanejadoAddPayload {
    tipoTreino: string;
    dataTreino: string;         // ISO-8601 date, e.g. "2026-07-03"
    descricao?: string;
    distanciaKm?: number;
    duracaoMin?: number;        // inteiro em minutos
    zonaAlvo?: string;
    percepcaoEsforcoEsperada?: number;
    tssPlanejado?: number;
    observacoes?: string;
    etapas?: EtapaInputPayload[];
}

/** Etapa simples ou bloco repetido no payload de criação. */
export interface EtapaInputPayload {
    tipoEtapa: string;           // "BLOCO" para blocos repetidos; tipo normal para etapas avulsas
    descricaoEtapa?: string;
    duracaoMin?: number;
    distanciaKm?: number;
    fcAlvoEtapa?: string;
    repeticoes?: number;
    blocoRepeticoes?: number;    // somente quando tipoEtapa="BLOCO"
    subEtapas?: EtapaInputPayload[];  // somente quando tipoEtapa="BLOCO"
}

/** Campos editáveis de um treino planejado durante revisão. Campos undefined são ignorados (patch semântico). */
export interface TreinoPlanejadoPatch {
    tipoTreino?: string;
    descricao?: string;
    distanciaKm?: number;
    duracaoMin?: string; // ISO-8601: "PT90M"
    zonaAlvo?: string;
    tssPlanejado?: number;
    percepcaoEsforcoEsperada?: number;
    observacao?: string;
    etapas?: EtapaTreinoDto[];
}

/**
 * Plano semanal retornado pelos endpoints de revisão.
 * Espelha `PlanoSemanalOutputDto` do backend + campos de review.
 */
export interface PlanoSemanalDto {
    id: string;
    semanaInicio: string;
    semanaFim: string;
    volumePlanejadoKm: number;
    volumeRealizadoKm: number;
    volumeAlvoKm: number;
    tsbInicio?: number;
    tsbFim?: number;
    status: PlanoStatus;
    observacoes?: string;
    objetivoSemanal?: string;
    treinosPlanejados?: TreinoPlanejadoDto[];
    reviewStatus: string | PlanoReviewStatusDto;
    reviewComment?: string;
    atletaNome?: string;
}

/** Payload do endpoint POST /{id}/rejeitar. */
export interface PlanoRejectionInput {
    motivo: string;
}
