/** Status de revisão do plano pelo coach — espelha `PlanoReviewStatus` do backend. */
export type PlanoReviewStatus = 'AGUARDANDO_REVISAO' | 'APROVADO' | 'REJEITADO';

/** Status do plano semanal — espelha `PlanoStatus` do backend. */
export type PlanoStatus = 'PLANEJADO' | 'INICIADO' | 'EM_ANDAMENTO' | 'ATIVO' | 'CONCLUIDO';

/** Treino planejado resumido para exibição no painel de revisão. */
export interface TreinoPlanejadoDto {
    id?: string;
    dataTreino?: string;
    diaSemana: string;
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
}

/** Payload do endpoint POST /{id}/rejeitar. */
export interface PlanoRejectionInput {
    motivo: string;
}
