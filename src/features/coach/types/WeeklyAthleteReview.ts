import type { NivelAderencia, RecommendationType } from '../../../types/RevisaoSemanal';

/** Delta vs. a semana anterior, já com rótulo PT-BR da recomendação anterior. */
export interface WeeklyReviewDeltaVM {
    percentual: number | null;
    tsb: number | null;
    recomendacaoAnterior: string | null;
}

/** View model do card de revisão semanal — rótulos PT-BR prontos para exibir. */
export interface WeeklyReviewVM {
    periodo: string;
    recomendacao: string;
    recomendacaoTipo: RecommendationType;
    aderencia: string;
    aderenciaNivel: NivelAderencia;
    percentual: number | null;
    dadosSuficientes: boolean;
    delta: WeeklyReviewDeltaVM | null;
    nextWeekFocus: string | null;
}
