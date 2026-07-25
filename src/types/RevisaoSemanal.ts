/** Contrato da revisão semanal do atleta (Fatia 1 — GET /coach/atletas/{id}/revisao-semanal). */

export type RecommendationType = 'RECOVERY' | 'MAINTAIN' | 'PROGRESS';
export type NivelAderencia = 'ALTA' | 'MEDIA' | 'BAIXA';

/** Comparação com a semana anterior (campos ausentes quando `primeiraSemana`). */
export interface WeekOverWeekDeltaDto {
    primeiraSemana: boolean;
    deltaPercentualRealizacao?: number;
    deltaTsbFim?: number;
    recommendationAnterior?: RecommendationType;
}

/**
 * Revisão congelada da última semana fechada. Campos opcionais são omitidos pelo backend
 * (`@JsonInclude(NON_NULL)`); `nextWeekFocus` só existe a partir da Fatia 2.
 */
export interface RevisaoSemanalOutputDto {
    planoSemanalId: string;
    semanaInicio: string;
    semanaFim: string;
    recommendationType: RecommendationType;
    adherenceStatus: NivelAderencia;
    percentualRealizacao?: number;
    tsbFim?: number;
    dadosSuficientes: boolean;
    weekOverWeekDelta: WeekOverWeekDeltaDto;
    geradaEm: string;
    nextWeekFocus?: string;
}
