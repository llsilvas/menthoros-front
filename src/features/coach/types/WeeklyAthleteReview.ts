import type { NivelAderencia, RecommendationType } from '../../../types/RevisaoSemanal';

/** View model do card de revisão semanal — tudo já formatado para exibir; card só renderiza. */
export interface WeeklyReviewVM {
    periodo: string;
    recomendacao: string;
    recomendacaoTipo: RecommendationType;
    aderencia: string;
    aderenciaNivel: NivelAderencia;
    percentual: number | null;
    dadosSuficientes: boolean;
    /** Resumo já formatado do delta vs. semana anterior; `null` na primeira semana. */
    deltaResumo: string | null;
    nextWeekFocus: string | null;
}
