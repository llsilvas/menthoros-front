import { format, parseISO } from 'date-fns';
import type {
    NivelAderencia,
    RecommendationType,
    RevisaoSemanalOutputDto,
    WeekOverWeekDeltaDto,
} from '../../../types/RevisaoSemanal';
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

function comSinal(valor: number): string {
    return valor > 0 ? `+${valor}` : String(valor);
}

/** Resumo já formatado do delta ("aderência +15% · TSB +10 · era 'Recuperação'") ou null. */
function buildDeltaResumo(d: WeekOverWeekDeltaDto): string | null {
    if (d.primeiraSemana) return null;
    const partes: string[] = [];
    if (d.deltaPercentualRealizacao != null) partes.push(`aderência ${comSinal(d.deltaPercentualRealizacao)}%`);
    if (d.deltaTsbFim != null) partes.push(`TSB ${comSinal(d.deltaTsbFim)}`);
    if (d.recommendationAnterior != null) partes.push(`era "${RECOMENDACAO_LABEL[d.recommendationAnterior]}"`);
    return partes.length ? partes.join(' · ') : null;
}

/** Transforma o DTO da revisão no view model do card (rótulos PT-BR, período e delta já formatados). */
export function buildWeeklyReviewFromDto(dto: RevisaoSemanalOutputDto): WeeklyReviewVM {
    return {
        periodo: `${format(parseISO(dto.semanaInicio), 'dd/MM')} – ${format(parseISO(dto.semanaFim), 'dd/MM')}`,
        recomendacao: RECOMENDACAO_LABEL[dto.recommendationType],
        recomendacaoTipo: dto.recommendationType,
        aderencia: ADERENCIA_LABEL[dto.adherenceStatus],
        aderenciaNivel: dto.adherenceStatus,
        percentual: dto.percentualRealizacao ?? null,
        dadosSuficientes: dto.dadosSuficientes,
        deltaResumo: buildDeltaResumo(dto.weekOverWeekDelta),
        nextWeekFocus: dto.nextWeekFocus ?? null,
    };
}
