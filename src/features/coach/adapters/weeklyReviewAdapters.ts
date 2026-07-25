import { format, parseISO } from 'date-fns';
import type { NivelAderencia, RecommendationType, RevisaoSemanalOutputDto } from '../../../types/RevisaoSemanal';
import type { WeeklyReviewVM } from '../types/WeeklyAthleteReview';

const RECOMENDACAO_LABEL: Record<RecommendationType, string> = {
    RECOVERY: 'Recuperação',
    MAINTAIN: 'Manter',
    PROGRESS: 'Progredir',
};

const ADERENCIA_LABEL: Record<NivelAderencia, string> = {
    ALTA: 'Alta',
    MEDIA: 'Média',
    BAIXA: 'Baixa',
};

/** Transforma o DTO da revisão no view model do card (rótulos PT-BR, período formatado, delta). */
export function buildWeeklyReviewFromDto(dto: RevisaoSemanalOutputDto): WeeklyReviewVM {
    const d = dto.weekOverWeekDelta;
    return {
        periodo: `${format(parseISO(dto.semanaInicio), 'dd/MM')} – ${format(parseISO(dto.semanaFim), 'dd/MM')}`,
        recomendacao: RECOMENDACAO_LABEL[dto.recommendationType],
        recomendacaoTipo: dto.recommendationType,
        aderencia: ADERENCIA_LABEL[dto.adherenceStatus],
        aderenciaNivel: dto.adherenceStatus,
        percentual: dto.percentualRealizacao ?? null,
        dadosSuficientes: dto.dadosSuficientes,
        delta: d.primeiraSemana
            ? null
            : {
                  percentual: d.deltaPercentualRealizacao ?? null,
                  tsb: d.deltaTsbFim ?? null,
                  recomendacaoAnterior: d.recommendationAnterior
                      ? RECOMENDACAO_LABEL[d.recommendationAnterior]
                      : null,
              },
        nextWeekFocus: dto.nextWeekFocus ?? null,
    };
}
