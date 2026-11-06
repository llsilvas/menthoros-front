import type { EtapaTreino, TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { EtapaTreinoDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';
import { getSafeValue } from '../../../utils/safeValues';

/**
 * Duração da listagem (`MM:SS` ou `HH:MM:SS`) → `PT{total}M`. Sempre em minutos, nunca `PT1H5M`: o
 * editor compara o texto ao montar o diff e serializa `PT{n}M`, então outro formato mandaria uma
 * duração falsa no PATCH. Segundos arredondam ao minuto (segundos reais: `add-etapa-duracao-segundos`).
 */
function duracaoIso(duracao: string | number | undefined): string | undefined {
    const m = typeof duracao === 'string' ? /^(?:(\d+):)?(\d+):(\d{2})$/.exec(duracao.trim()) : null;
    const total = typeof duracao === 'number'
        ? Math.round(duracao)
        : m ? Number(m[1] ?? 0) * 60 + Number(m[2]) + Math.round(Number(m[3]) / 60) : 0;
    return total > 0 ? `PT${total}M` : undefined;
}

function toEditorEtapa(e: EtapaTreino): EtapaTreinoDto {
    return {
        ordem: e.ordem,
        tipoEtapa: String(getSafeValue(e.tipoEtapa)),
        descricaoEtapa: e.descricaoEtapa,
        duracaoMin: e.duracaoMin,
        duracaoSeg: e.duracaoSeg,
        distanciaKm: e.distanciaKm,
        fcAlvoEtapa: e.fcAlvoEtapa,
        ritmoAlvo: e.ritmoAlvo,
        alvoPrimario: e.alvoPrimario,
        repeticoes: e.repeticoes,
        blocoId: e.blocoId,
        blocoRepeticoes: e.blocoRepeticoes,
    };
}

/**
 * Treino da listagem do PlanosDialog → modelo do `TreinoEditDialog`, sem perda
 * (editar-treino-aprovado-planos-dialog, D4).
 */
export function toEditorTreino(t: TreinoPlanejado): TreinoPlanejadoDto {
    return {
        id: t.id,
        dataTreino: t.dataTreino,
        diaSemana: t.diaSemana,
        tipoTreino: String(getSafeValue(t.tipoTreino)),
        distanciaKm: t.distanciaKm,
        duracaoMin: duracaoIso(t.duracaoMin),
        descricao: t.descricao,
        zonaAlvo: t.zonaAlvo,
        observacao: t.observacao,
        justificativaIa: t.justificativaIa,
        tssPlanejado: t.tssPlanejado,
        percepcaoEsforcoEsperada: t.percepcaoEsforcoEsperada,
        etapas: t.etapas?.map(toEditorEtapa),
        provaId: t.provaId,
        treinoRealizadoId: t.treinoRealizadoId,
    };
}
