import type { EtapaInputPayload, EtapaTreinoDto } from '../../../../types/PlanoReview';
import { detectarJanelaRepetida } from '../../../workout/serie/janelaRepetida';

/**
 * Modelo de edição de etapas, compartilhado entre `TreinoAddDialog` e `TreinoEditDialog`.
 *
 * O treino é editado como uma lista de itens — etapas avulsas e blocos repetidos — e serializado
 * para o payload que o backend já consome (`tipoEtapa: 'BLOCO'` + `subEtapas`). O banco persiste os
 * blocos **expandidos**, N cópias com o mesmo `blocoId`, então `itensFromEtapas` faz o caminho de
 * volta.
 */

export interface StepRow {
    id: string;
    kind: 'step';
    tipoEtapa: string;
    duracaoMin: string;
    distanciaKm: string;
    fcAlvoEtapa: string;
}

export interface SubStep {
    id: string;
    tipoEtapa: string;
    duracaoMin: string;
    distanciaKm: string;
    fcAlvoEtapa: string;
}

export interface BlockRow {
    id: string;
    kind: 'block';
    repeticoes: string;
    steps: SubStep[];
}

export type EtapaItem = StepRow | BlockRow;

export function emptyStep(): StepRow {
    return { id: crypto.randomUUID(), kind: 'step', tipoEtapa: '', duracaoMin: '', distanciaKm: '', fcAlvoEtapa: '' };
}

export function emptySubStep(): SubStep {
    return { id: crypto.randomUUID(), tipoEtapa: '', duracaoMin: '', distanciaKm: '', fcAlvoEtapa: '' };
}

export function emptyBlock(): BlockRow {
    return { id: crypto.randomUUID(), kind: 'block', repeticoes: '3', steps: [emptySubStep(), emptySubStep()] };
}

function subEtapaPayload(s: SubStep): EtapaInputPayload {
    return {
        tipoEtapa:   s.tipoEtapa,
        duracaoMin:  s.duracaoMin  ? parseInt(s.duracaoMin, 10) : undefined,
        distanciaKm: s.distanciaKm ? parseFloat(s.distanciaKm)  : undefined,
        fcAlvoEtapa: s.fcAlvoEtapa || undefined,
    };
}

export function serializarItens(itens: EtapaItem[]): EtapaInputPayload[] {
    return itens.flatMap((item): EtapaInputPayload[] => {
        if (item.kind === 'block') {
            const subEtapas = item.steps.filter(s => s.tipoEtapa).map(subEtapaPayload);
            if (!subEtapas.length) return [];
            const reps = parseInt(item.repeticoes, 10) || 1;
            // Um bloco de uma repetição não é um bloco: emitir BLOCO(1) criaria um agrupamento
            // degenerado que o backend expandiria de volta para as mesmas sub-etapas, agora com um
            // blocoId que não significa nada.
            if (reps <= 1) return subEtapas;
            return [{ tipoEtapa: 'BLOCO', blocoRepeticoes: reps, subEtapas }];
        }
        if (!item.tipoEtapa) return [];
        return [{
            tipoEtapa:   item.tipoEtapa,
            duracaoMin:  item.duracaoMin  ? parseInt(item.duracaoMin, 10) : undefined,
            distanciaKm: item.distanciaKm ? parseFloat(item.distanciaKm)  : undefined,
            fcAlvoEtapa: item.fcAlvoEtapa || undefined,
        }];
    });
}

// ── Hidratação: etapas planas → itens de edição ───────────────────────────────

const txt = (v: number | undefined) => (v != null ? String(v) : '');

function subStepFromEtapa(e: EtapaTreinoDto): SubStep {
    return {
        id: crypto.randomUUID(),
        tipoEtapa: e.tipoEtapa,
        duracaoMin: txt(e.duracaoMin),
        distanciaKm: txt(e.distanciaKm),
        fcAlvoEtapa: e.fcAlvoEtapa ?? '',
    };
}

function stepFromEtapa(e: EtapaTreinoDto): StepRow {
    return { ...subStepFromEtapa(e), kind: 'step' };
}

/**
 * Vocabulário do editor para a detecção de série (`detectarJanelaRepetida`).
 *
 * A assinatura inclui `distanciaKm`, e o esforço é reconhecido só por
 * `INTERVALADO` — que é o que espelha `IntervalsIcuWorkoutConverter.inferirBloco`
 * no backend. O perfil do treino usa o mesmo algoritmo com outro vocabulário,
 * mais amplo; a diferença é declarada aqui, e não em duas implementações.
 */
const VOCABULARIO_EDITOR = {
    /** A descrição e a ordem são ruído: não entram na assinatura. */
    assinatura: (e: EtapaTreinoDto) =>
        `${e.tipoEtapa}|${e.duracaoMin}|${e.distanciaKm}|${e.fcAlvoEtapa}`,
    ehTrabalho: (e: EtapaTreinoDto) => e.tipoEtapa?.toUpperCase() === 'INTERVALADO',
};

function blocoDeJanela(etapas: EtapaTreinoDto[], inicio: number, janela: number, reps: number): BlockRow {
    return {
        id: crypto.randomUUID(),
        kind: 'block',
        repeticoes: String(reps),
        steps: etapas.slice(inicio, inicio + janela).map(subStepFromEtapa),
    };
}

/**
 * Reconstrói os itens de edição a partir das etapas planas devolvidas pelo backend.
 *
 * Duas fontes de agrupamento, nesta ordem:
 * 1. `blocoId` — dado explícito, gravado quando o treinador salvou um bloco;
 * 2. repetição observada — para treinos gerados pela IA, que nascem sem `blocoId`.
 *
 * A regra 2 espelha `IntervalsIcuWorkoutConverter.inferirBloco` no backend, incluindo a exigência
 * de uma etapa `INTERVALADO` na janela. Ao mexer aqui, conferir lá.
 */
export function itensFromEtapas(etapas: EtapaTreinoDto[] | undefined): EtapaItem[] {
    if (!etapas?.length) return [];

    const itens: EtapaItem[] = [];
    let i = 0;

    while (i < etapas.length) {
        const blocoId = etapas[i].blocoId;

        if (blocoId) {
            let fim = i + 1;
            while (fim < etapas.length && etapas[fim].blocoId === blocoId) fim++;
            const tamanho = fim - i;
            const reps = etapas[i].blocoRepeticoes ?? 0;

            if (reps > 1 && tamanho % reps === 0) {
                itens.push(blocoDeJanela(etapas, i, tamanho / reps, reps));
            } else {
                // Agrupamento inconsistente: preserva as etapas em vez de forçar um bloco torto.
                for (let p = i; p < fim; p++) itens.push(stepFromEtapa(etapas[p]));
            }
            i = fim;
            continue;
        }

        // Sem blocoId: procura a janela que cobre mais etapas a partir daqui.
        const limite = (() => {
            let l = i;
            while (l < etapas.length && !etapas[l].blocoId) l++;
            return l;
        })();
        const serie = detectarJanelaRepetida(etapas, i, limite, VOCABULARIO_EDITOR);

        if (!serie) {
            itens.push(stepFromEtapa(etapas[i]));
            i++;
        } else {
            itens.push(blocoDeJanela(etapas, i, serie.janela, serie.reps));
            i += serie.janela * serie.reps;
        }
    }

    return itens;
}
