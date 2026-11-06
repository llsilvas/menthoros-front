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
    /** Duração em `m:ss` (`4` vale `4:00`; `h:mm:ss` aceito). Vai ao contrato como `duracaoSeg`. */
    duracao: string;
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
    /** View-model: a duração veio de distância × pace. Nunca junto com `distanciaAuto`. */
    duracaoAuto?: boolean;
}

export interface SubStep {
    id: string;
    tipoEtapa: string;
    duracao: string;
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
    /** View-model: a duração veio de distância × pace. Nunca junto com `distanciaAuto`. */
    duracaoAuto?: boolean;
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
        tipoEtapa: '', duracao: '', distanciaKm: '', fcAlvoEtapa: '',
    };
}

export function emptySubStep(): SubStep {
    return {
        id: crypto.randomUUID(),
        tipoEtapa: '', duracao: '', distanciaKm: '', fcAlvoEtapa: '',
    };
}

export function emptyBlock(): BlockRow {
    return { id: crypto.randomUUID(), kind: 'block', repeticoes: '3', steps: [emptySubStep(), emptySubStep()] };
}

function subEtapaPayload(s: SubStep): EtapaInputPayload {
    // Derivada fica fora (nos dois sentidos): o conversor do intervals.icu descarta a duração quando
    // há distância, e o tiro de 4 min viraria um tiro de 0,83 km no relógio.
    const seg = s.duracaoAuto ? null : segundosDe(s.duracao);
    // O backend deriva o mesmo minuto de `duracaoSeg` (round, sem piso); o enviado é só
    // compatibilidade, e abaixo de 30 s daria 0, que `@Positive` rejeita.
    const min = seg ? Math.round(seg / 60) : 0;
    return {
        tipoEtapa:      s.tipoEtapa,
        duracaoSeg:     seg || undefined,
        duracaoMin:     min > 0 ? min : undefined,
        distanciaKm:    s.distanciaKm && !s.distanciaAuto ? parseFloat(s.distanciaKm) : undefined,
        fcAlvoEtapa:    s.fcAlvoEtapa || undefined,
        ritmoAlvo:      s.ritmoAlvo || undefined,
        descricaoEtapa: s.descricaoEtapa?.trim() || undefined,
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
    const seg = e.duracaoSeg ?? (e.duracaoMin != null ? e.duracaoMin * 60 : null);
    const passo: SubStep = {
        id: crypto.randomUUID(),
        tipoEtapa: e.tipoEtapa,
        // Minuto 0 sem segundo gravado é "sem duração", não `0:00` (que o campo recusa).
        duracao: seg ? formatarDuracao(seg) : '',
        distanciaKm: txt(e.distanciaKm),
        fcAlvoEtapa: e.fcAlvoEtapa ?? '',
        ritmoAlvo: e.ritmoAlvo,
        descricaoEtapa: e.descricaoEtapa,
        alvoPrimario: e.alvoPrimario,
    };
    // Medida gravada é do treinador (a derivada nunca vai ao PATCH); a vazia volta a ser derivada.
    const medidas = { ...passo, ritmoAlvo: passo.ritmoAlvo ?? '' };
    if (!passo.distanciaKm) {
        const km = distanciaEstimada(medidas);
        return km == null ? passo : { ...passo, distanciaKm: String(km), distanciaAuto: true };
    }
    if (!passo.duracao) {
        const s = duracaoEstimada(medidas);
        return s == null ? passo : { ...passo, duracao: formatarDuracao(s), duracaoAuto: true };
    }
    return passo;
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
        `${e.tipoEtapa}|${e.duracaoMin}|${e.duracaoSeg}|${e.distanciaKm}|${e.fcAlvoEtapa}|${e.ritmoAlvo}|${e.alvoPrimario}`,
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

// ── Duração em m:ss ───────────────────────────────────────────────────────────

/** Segundos de `m`, `m:ss` ou `h:mm:ss`; `null` para vazio ou texto que não parseia. */
export function segundosDe(texto: string): number | null {
    const partes = texto.trim().split(':');
    if (partes.length > 3 || partes.some(p => !/^\d+$/.test(p))) return null;
    const n = partes.map(Number);
    if (n.length === 1) return n[0] * 60;
    if (n.length === 2) return n[1] > 59 ? null : n[0] * 60 + n[1];
    return n[1] > 59 || n[2] > 59 ? null : n[0] * 3600 + n[1] * 60 + n[2];
}

/** `250` → `4:10`; a partir de uma hora, `h:mm:ss`. */
export function formatarDuracao(seg: number): string {
    const total = Math.max(0, Math.round(seg));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const ss = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Texto válido volta formatado (`4` → `4:00`, `4:7` → `4:07`); vazio ou inválido fica como está. */
export function normalizarDuracao(texto: string): string {
    const seg = segundosDe(texto);
    return seg == null ? texto : formatarDuracao(seg);
}

/** Vazio não é inválido: é "sem duração". Zero é: omiti-lo do PATCH apagaria a duração gravada. */
export function duracaoInvalida(texto: string): boolean {
    if (texto.trim() === '') return false;
    const seg = segundosDe(texto);
    return seg == null || seg === 0;
}

/** Para ler: `24 min` em minuto cheio, `16:40` quando há segundos. Cabeçalho da série e card. */
export function duracaoLegivel(seg: number): string {
    return seg % 60 === 0 ? `${seg / 60} min` : formatarDuracao(seg);
}

/** Algum item com duração que não parseia — bloqueia o salvar nos dois dialogs. */
export function itensInvalidos(itens: EtapaItem[]): boolean {
    return itens.some(item => item.kind === 'step'
        ? duracaoInvalida(item.duracao)
        : item.steps.some(s => duracaoInvalida(s.duracao)));
}

// ── Medidas derivadas ─────────────────────────────────────────────────────────

export interface MedidasEtapa {
    distanciaKm: string;
    duracao: string;
    ritmoAlvo: string;
    distanciaAuto?: boolean;
    duracaoAuto?: boolean;
}

export type CampoEditado = 'duracao' | 'distancia' | 'pace';

/** Faixa de pace usa o ponto médio: é a melhor estimativa de um alvo que admite os dois extremos. */
function segPorKm(ritmoAlvo: string): number | null {
    const pace = parseCanonicalPace(ritmoAlvo);
    if (!pace) return null;
    const segKm = (pace.minSegKm + pace.maxSegKm) / 2;
    return segKm > 0 ? segKm : null;
}

function distanciaEstimada({ duracao, ritmoAlvo }: MedidasEtapa): number | null {
    const seg = segundosDe(duracao);
    const segKm = segPorKm(ritmoAlvo);
    if (!(seg != null && seg > 0) || segKm == null) return null;
    return Number((seg / segKm).toFixed(2));
}

function duracaoEstimada({ distanciaKm, ritmoAlvo }: MedidasEtapa): number | null {
    const km = parseFloat(distanciaKm);
    const segKm = segPorKm(ritmoAlvo);
    if (!(km > 0) || segKm == null) return null;
    return Math.round(km * segKm);
}

export type MedidasDerivadas = Pick<MedidasEtapa, 'distanciaKm' | 'distanciaAuto' | 'duracao' | 'duracaoAuto'>;

/**
 * Regra dos três campos: o último editado manda e só o campo derivado muda.
 *
 * - duração digitada: vira manual; a distância recalcula só se derivada ou vazia;
 * - distância digitada: vira manual; a duração recalcula só se derivada ou vazia;
 * - pace/zona: recalcula o campo marcado como derivado; sem marcador, deriva o vazio se o outro
 *   está preenchido; com os dois preenchidos, nada muda.
 *
 * Sem fonte (duração/distância apagada, pace apagado) a derivada é limpa. Pace incompleto da
 * digitação ("5:0") mantém valor e marcador, senão o calculado viraria manual no meio da edição.
 */
export function recalcularMedidas(antes: MedidasEtapa, depois: MedidasEtapa, editado: CampoEditado): MedidasDerivadas {
    const base: MedidasEtapa = {
        distanciaKm: depois.distanciaKm, duracao: depois.duracao, ritmoAlvo: depois.ritmoAlvo,
        distanciaAuto: !!antes.distanciaAuto, duracaoAuto: !!antes.duracaoAuto,
    };
    if (editado === 'duracao') base.duracaoAuto = false;
    if (editado === 'distancia') base.distanciaAuto = false;

    const distanciaDerivavel = base.distanciaAuto || !(parseFloat(base.distanciaKm) > 0);
    // Texto inválido ("4:") é do treinador: fica, com o erro à vista, em vez de virar derivado.
    const duracaoDerivavel = base.duracaoAuto || base.duracao.trim() === '';
    const paceIncompleto = !!depois.ritmoAlvo.trim() && segPorKm(depois.ritmoAlvo) == null;

    const derivaDistancia = () => {
        if (paceIncompleto) return;
        const km = distanciaEstimada(base);
        if (km != null) { base.distanciaKm = String(km); base.distanciaAuto = true; return; }
        if (base.distanciaAuto) base.distanciaKm = '';
        base.distanciaAuto = false;
    };
    const derivaDuracao = () => {
        if (paceIncompleto) return;
        const seg = duracaoEstimada(base);
        if (seg != null) { base.duracao = formatarDuracao(seg); base.duracaoAuto = true; return; }
        if (base.duracaoAuto) base.duracao = '';
        base.duracaoAuto = false;
    };

    if (editado === 'duracao') {
        if (duracaoInvalida(base.duracao)) return base;
        if (distanciaDerivavel) derivaDistancia();
    } else if (editado === 'distancia') {
        if (duracaoDerivavel) derivaDuracao();
    } else if (base.distanciaAuto) {
        derivaDistancia();
    } else if (base.duracaoAuto) {
        derivaDuracao();
    } else if (distanciaDerivavel && !duracaoDerivavel) {
        derivaDistancia();
    } else if (duracaoDerivavel && !distanciaDerivavel) {
        derivaDuracao();
    }
    return { distanciaKm: base.distanciaKm, distanciaAuto: base.distanciaAuto, duracao: base.duracao, duracaoAuto: base.duracaoAuto };
}

// ── Totais ────────────────────────────────────────────────────────────────────

/**
 * Soma de duração e distância do treino INTEIRO: uma série de N repetições conta N vezes as suas
 * etapas. Fonte única para os dois diálogos — o de adição tinha a própria conta, o de edição outra.
 * Valores crus (sem arredondar): cada tela escolhe quantas casas mostrar.
 */
export function totaisDeItens(itens: EtapaItem[]): { seg: number; km: number } {
    let seg = 0;
    let km = 0;
    for (const item of itens) {
        const t = totaisDoItem(item);
        seg += t.seg;
        km += t.km;
    }
    return { seg, km };
}

/** Total de um item: a série já multiplicada pelas repetições — é o que o cabeçalho dela mostra. */
export function totaisDoItem(item: EtapaItem): { seg: number; km: number } {
    if (item.kind === 'step') {
        return { seg: segundosDe(item.duracao) ?? 0, km: parseFloat(item.distanciaKm) || 0 };
    }
    const reps = Math.max(1, parseInt(item.repeticoes, 10) || 1);
    let seg = 0;
    let km = 0;
    for (const s of item.steps) {
        seg += (segundosDe(s.duracao) ?? 0) * reps;
        km  += (parseFloat(s.distanciaKm) || 0) * reps;
    }
    return { seg, km };
}

/** "4× · 24 min · 4,3 km"; parte zerada some. Sem pace médio: tiro e recuperação juntos não têm um. */
export function resumoDaSerie(item: BlockRow): string {
    const { seg, km } = totaisDoItem(item);
    const partes = [`${Math.max(1, parseInt(item.repeticoes, 10) || 1)}×`];
    if (seg > 0) partes.push(duracaoLegivel(seg));
    if (km > 0) partes.push(`${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`);
    return partes.join(' · ');
}
