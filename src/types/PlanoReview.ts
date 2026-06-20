import type { PlanoStatus } from './PlanoSemanal';
export type { PlanoStatus };

/** Status de revisão do plano pelo coach — espelha `PlanoReviewStatus` do backend. */
export type PlanoReviewStatus = 'AGUARDANDO_REVISAO' | 'APROVADO' | 'REJEITADO';

/** Shape do enum DiaSemana serializado pelo backend com @JsonFormat(OBJECT). */
export interface DiaSemanaDto {
    value: string;
    label: string;
    short?: string;
    order?: number;
}

/** Treino planejado resumido para exibição no painel de revisão. */
export interface TreinoPlanejadoDto {
    id?: string;
    dataTreino?: string;
    diaSemana: string | DiaSemanaDto;
    tipoTreino: string;
    distanciaKm: number;
    duracaoMin?: string;
    observacao?: string;
    justificativaIa?: string;
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
    reviewStatus: PlanoReviewStatus;
    reviewComment?: string;
    atletaNome?: string;
}

/** Payload do endpoint POST /{id}/rejeitar. */
export interface PlanoRejectionInput {
    motivo: string;
}
