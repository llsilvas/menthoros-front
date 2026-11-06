import type { AlvoPrimario } from '../../../../types/AthleteTrainingZones';
import type { EtapaInputPayload, EtapaTreinoDto } from '../../../../types/PlanoReview';
import type { ZoneKey } from '../../../workout/profile/types';
import { detectarJanelaRepetida } from '../../../workout/serie/janelaRepetida';
import { parseCanonicalPace } from '../../adapters/intensityFormat';

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
    /**
     * Meta de ritmo da etapa (`"5:00-5:15/km"`), a alternativa à FC.
     *
     * Mesmo tratamento de `descricaoEtapa`: o editor ainda não expõe um campo,
     * então ela viaja de ida e volta intacta. O planner prescreve ritmo por
     * etapa — o schema do structured output exige `ritmoAlvo` em cada uma —, e
     * sem isto abrir um treino e salvar apagava a prescrição de todas elas.
     */
    ritmoAlvo?: string;
    /**
     * Texto que o treinador (ou a IA) escreveu para a etapa.
     *
     * O editor **não o expõe para edição** — ele viaja de ida e volta intacto.
     * Sem isso, abrir um treino e salvar apagava a descrição de todas as etapas
     * em silêncio, e é dado do plano do atleta. É também o campo onde a zona
     * costuma estar escrita ("Corrida contínua Z2"), que o perfil do treino lê.
     */
    descricaoEtapa?: string;
    /** Eixo que o relógio controla; ausente em etapa legada (o backend deriva do conteúdo). */
    alvoPrimario?: AlvoPrimario;
    /**
     * Zona escolhida no seletor — só view-model do editor, não vai ao contrato. `PERSONALIZADO`
     * quando o treinador editou os valores à mão ou o texto não casa nenhuma zona do atleta.
     */
    zonaEtapa?: ZoneKey | 'PERSONALIZADO';
    /** View-model: o treinador escolheu o eixo do relógio nesta sessão. Não vai ao contrato. */
    eixoTocado?: boolean;
    /** View-model: a distância veio de pace × duração e acompanha os dois. Não vai ao contrato. */
    distanciaAuto?: boolean;
}

export interface SubStep {
    id: string;
    tipoEtapa: string;
    duracaoMin: string;
    distanciaKm: string;
    fcAlvoEtapa: string;
    /** Preservado de ponta a ponta, como em `StepRow`. */
    ritmoAlvo?: string;
    /** Preservada de ponta a ponta, como em `StepRow`. */
    descricaoEtapa?: string;
    alvoPrimario?: AlvoPrimario;
    zonaEtapa?: ZoneKey | 'PERSONALIZADO';
    /** View-model: o treinador escolheu o eixo do relógio nesta sessão. Não vai ao contrato. */
    eixoTocado?: boolean;
    /** View-model: a distância veio de pace × duração e acompanha os dois. Não vai ao contrato. */
    distanciaAuto?: boolean;
}

export interface BlockRow {
    id: string;
    kind: 'block';
    repeticoes: string;
    steps: SubStep[];
}

export type EtapaItem = StepRow | BlockRow;

export function emptyStep(): StepRow {
    return {
        id: crypto.randomUUID(), kind: 'step',
        tipoEtapa: '', duracaoMin: '', distanciaKm: '', fcAlvoEtapa: '',
    };
}

export function emptySubStep(): SubStep {
    return {
        id: crypto.randomUUID(),
        tipoEtapa: '', duracaoMin: '', distanciaKm: '', fcAlvoEtapa: '',
    };
}

export function emptyBlock(): BlockRow {
    return { id: crypto.randomUUID(), kind: 'block', repeticoes: '3', steps: [emptySubStep(), emptySubStep()] };
}

function subEtapaPayload(s: SubStep): EtapaInputPayload {
    return {
        tipoEtapa:      s.tipoEtapa,
        duracaoMin:     s.duracaoMin  ? parseInt(s.duracaoMin, 10) : undefined,
        // Derivada fica fora: o conversor do intervals.icu descarta a duração quando há distância,
        // e o tiro de 4 min viraria um tiro de 0,83 km no relógio.
        distanciaKm:    s.distanciaKm && !s.distanciaAuto ? parseFloat(s.distanciaKm) : undefined,
        fcAlvoEtapa:    s.fcAlvoEtapa || undefined,
        ritmoAlvo:      s.ritmoAlvo || undefined,
        descricaoEtapa: s.descricaoEtapa || undefined,
        alvoPrimario:   s.alvoPrimario,
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
        return [subEtapaPayload(item)];
    });
}

// ── Hidratação: etapas planas → itens de edição ───────────────────────────────

const txt = (v: number | undefined) => (v != null ? String(v) : '');

function subStepFromEtapa(e: EtapaTreinoDto): SubStep {
    const passo: SubStep = {
        id: crypto.randomUUID(),
        tipoEtapa: e.tipoEtapa,
        duracaoMin: txt(e.duracaoMin),
        distanciaKm: txt(e.distanciaKm),
        fcAlvoEtapa: e.fcAlvoEtapa ?? '',
        ritmoAlvo: e.ritmoAlvo,
        descricaoEtapa: e.descricaoEtapa,
        alvoPrimario: e.alvoPrimario,
    };
    // Distância gravada é do treinador (a derivada nunca vai ao PATCH); vazia volta a ser derivada.
    const estimada = passo.distanciaKm ? null : distanciaEstimada({ ...passo, ritmoAlvo: passo.ritmoAlvo ?? '' });
    return estimada == null ? passo : { ...passo, distanciaKm: String(estimada), distanciaAuto: true };
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
        `${e.tipoEtapa}|${e.duracaoMin}|${e.distanciaKm}|${e.fcAlvoEtapa}|${e.ritmoAlvo}|${e.alvoPrimario}`,
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

// ── Distância derivada ────────────────────────────────────────────────────────

export interface MedidasEtapa {
    distanciaKm: string;
    duracaoMin: string;
    ritmoAlvo: string;
    distanciaAuto?: boolean;
}

/** Minutos inteiros, como o serializador envia (`parseInt`): 4.5 min deriva como 4. */
const minutosDe = (duracaoMin: string) => parseInt(duracaoMin, 10);

/** Faixa de pace usa o ponto médio: é a melhor estimativa de um alvo que admite os dois extremos. */
function distanciaEstimada({ duracaoMin, ritmoAlvo }: MedidasEtapa): number | null {
    const minutos = minutosDe(duracaoMin);
    const pace = parseCanonicalPace(ritmoAlvo);
    if (!(minutos > 0) || !pace) return null;
    const segKm = (pace.minSegKm + pace.maxSegKm) / 2;
    return segKm > 0 ? Number(((minutos * 60) / segKm).toFixed(2)) : null;
}

/**
 * Distância depois de mudar pace ou duração. Só mexe em distância vazia, zerada ou já derivada: valor
 * digitado ou gravado fica. Sem duração ou sem pace não há de onde derivar, e a derivada é limpa; já
 * o pace incompleto da digitação ("5:0") mantém valor e marcador, senão a distância calculada viraria
 * manual no meio da edição.
 */
export function recalcularDistancia(antes: MedidasEtapa, depois: MedidasEtapa): Pick<MedidasEtapa, 'distanciaKm' | 'distanciaAuto'> {
    const derivavel = antes.distanciaAuto || !parseFloat(antes.distanciaKm);
    if (!derivavel) return { distanciaKm: antes.distanciaKm, distanciaAuto: false };
    if (!(minutosDe(depois.duracaoMin) > 0) || !depois.ritmoAlvo.trim()) {
        return { distanciaKm: antes.distanciaAuto ? '' : antes.distanciaKm, distanciaAuto: false };
    }
    const estimada = distanciaEstimada(depois);
    if (estimada == null) return { distanciaKm: antes.distanciaKm, distanciaAuto: !!antes.distanciaAuto };
    return { distanciaKm: String(estimada), distanciaAuto: true };
}

// ── Totais ────────────────────────────────────────────────────────────────────

/**
 * Soma de duração e distância do treino INTEIRO: uma série de N repetições conta N vezes as suas
 * etapas. Fonte única para os dois diálogos — o de adição tinha a própria conta, o de edição outra.
 * Valores crus (sem arredondar): cada tela escolhe quantas casas mostrar.
 */
export function totaisDeItens(itens: EtapaItem[]): { min: number; km: number } {
    let min = 0;
    let km = 0;
    for (const item of itens) {
        const t = totaisDoItem(item);
        min += t.min;
        km += t.km;
    }
    return { min, km };
}

/** Total de um item: a série já multiplicada pelas repetições — é o que o cabeçalho dela mostra. */
export function totaisDoItem(item: EtapaItem): { min: number; km: number } {
    if (item.kind === 'step') {
        return { min: parseInt(item.duracaoMin, 10) || 0, km: parseFloat(item.distanciaKm) || 0 };
    }
    const reps = Math.max(1, parseInt(item.repeticoes, 10) || 1);
    let min = 0;
    let km = 0;
    for (const s of item.steps) {
        min += (parseInt(s.duracaoMin, 10) || 0) * reps;
        km  += (parseFloat(s.distanciaKm) || 0) * reps;
    }
    return { min, km };
}

/** "4× · 24 min · 4,3 km"; parte zerada some. Sem pace médio: tiro e recuperação juntos não têm um. */
export function resumoDaSerie(item: BlockRow): string {
    const { min, km } = totaisDoItem(item);
    const partes = [`${Math.max(1, parseInt(item.repeticoes, 10) || 1)}×`];
    if (min > 0) partes.push(`${min} min`);
    if (km > 0) partes.push(`${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`);
    return partes.join(' · ');
}
