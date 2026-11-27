import type { SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

/** Formulário de edição de uma semana do ajuste da temporada: números como texto digitado. */
export interface SeasonWeekForm {
    phase: TrainingPhase;
    targetVolumeKm: string;
    longRunKm: string;
    targetTss: string;
    deload: boolean;
    keySessions: string;
    /** "Recalcular as semanas seguintes até a prova" em vez de "Só esta semana". */
    recalcular: boolean;
    followingPeakVolumeKm: string;
}

export type SeasonWeekFormErrors = Partial<Record<'targetVolumeKm' | 'longRunKm' | 'targetTss' | 'followingPeakVolumeKm', string>>;

export const KEY_SESSIONS_MAX = 500;

/** Inteiro ou decimal não negativo, com vírgula ou ponto (sem notação científica ou hexadecimal). */
const NUMERO = /^\d+([.,]\d+)?$/;

/** Fases da rampa até o pico (`SeasonPlanner.RAMP_PHASES` no backend). */
const RAMP_PHASES: readonly TrainingPhase[] = ['BASE', 'BUILD', 'PEAK'];

/** Diferença a partir da qual o pico alcançado é aviso, não arredondamento. */
const AVISO_PICO_KM = 0.5;

const umaCasa = (n: number) => Math.round(n * 10) / 10;

export const toSeasonWeekForm = (w: SeasonWeek): SeasonWeekForm => ({
    phase: w.phase,
    targetVolumeKm: w.targetVolumeKm == null ? '' : String(w.targetVolumeKm),
    longRunKm: w.longRunKm == null ? '' : String(w.longRunKm),
    targetTss: w.targetTss == null ? '' : String(Math.round(w.targetTss)),
    deload: w.deload,
    keySessions: w.keySessions ?? '',
    recalcular: false,
    followingPeakVolumeKm: '',
});

/** Número não negativo do texto; `undefined` se vazio ou inválido. */
export const parseNumeroNaoNegativo = (texto: string): number | undefined => {
    const limpo = texto.trim();
    return NUMERO.test(limpo) ? Number(limpo.replace(',', '.')) : undefined;
};

/**
 * Erros por campo. Os três números são obrigatórios: o backend não limpa um valor (campo ausente = não
 * muda), então apagar o campo prometeria uma limpeza que não acontece.
 */
export const validateSeasonWeekForm = (form: SeasonWeekForm): SeasonWeekFormErrors => {
    const errors: SeasonWeekFormErrors = {};
    (['targetVolumeKm', 'longRunKm', 'targetTss'] as const).forEach((campo) => {
        if (parseNumeroNaoNegativo(form[campo]) === undefined) errors[campo] = 'Informe um número maior ou igual a zero';
    });
    if (recalculando(form)) {
        const pico = parseNumeroNaoNegativo(form.followingPeakVolumeKm);
        const volume = parseNumeroNaoNegativo(form.targetVolumeKm) ?? 0;
        if (pico === undefined || pico < volume) {
            errors.followingPeakVolumeKm = 'O pico precisa ser maior ou igual ao volume da semana';
        }
    }
    return errors;
};

/** A opção de recalcular vale para o estado final do formulário: Base, Construção ou Pico, sem descarga. */
export const podeRecalcular = (form: SeasonWeekForm): boolean => RAMP_PHASES.includes(form.phase) && !form.deload;

const recalculando = (form: SeasonWeekForm) => form.recalcular && podeRecalcular(form);

/** Corpo do PATCH; chamar só com o formulário válido. `keySessions` vazio limpa no backend. */
export const toSeasonWeekUpdate = (form: SeasonWeekForm): SeasonWeekUpdate => ({
    phase: form.phase,
    targetVolumeKm: parseNumeroNaoNegativo(form.targetVolumeKm),
    longRunKm: parseNumeroNaoNegativo(form.longRunKm),
    targetTss: parseNumeroNaoNegativo(form.targetTss),
    deload: form.deload,
    keySessions: form.keySessions.trim(),
    ...(recalculando(form) ? { followingPeakVolumeKm: parseNumeroNaoNegativo(form.followingPeakVolumeKm) } : {}),
});

/** TSS na proporção do volume novo sobre o original; `undefined` sem TSS ou volume original positivos. */
export const tssProporcional = (week: SeasonWeek, volumeTexto: string): string | undefined => {
    const volume = parseNumeroNaoNegativo(volumeTexto);
    if (volume === undefined || !(week.targetTss > 0) || !(week.targetVolumeKm > 0)) return undefined;
    return String(Math.round(week.targetTss * volume / week.targetVolumeKm));
};

const subidaDepois = (weeks: SeasonWeek[], anchorIndex: number) =>
    weeks.filter((w) => w.weekIndex > anchorIndex && RAMP_PHASES.includes(w.phase));

/** Maior volume entre a âncora e as semanas de subida depois dela (o "pico alcançado" do backend). */
export const picoDeSubida = (weeks: SeasonWeek[], anchorIndex: number): number =>
    Math.max(...weeks.filter((w) => w.weekIndex === anchorIndex).concat(subidaDepois(weeks, anchorIndex))
        .map((w) => w.targetVolumeKm ?? 0));

/**
 * Pico sugerido: a última semana de subida na proporção da edição (o volume novo, se a âncora é a última).
 * Vazio quando a edição não sobe o volume: derrubar a temporada inteira precisa ser digitado.
 */
export const picoSugerido = (weeks: SeasonWeek[], week: SeasonWeek, volumeTexto: string): string => {
    const volume = parseNumeroNaoNegativo(volumeTexto);
    if (volume === undefined || !(week.targetVolumeKm > 0) || volume <= week.targetVolumeKm) return '';
    const subida = subidaDepois(weeks, week.weekIndex);
    const ultima = subida[subida.length - 1];
    return String(ultima ? umaCasa(ultima.targetVolumeKm * volume / week.targetVolumeKm) : volume);
};

/** Semanas depois da âncora que o recálculo reescreve e as que ficam (editadas pelo treinador ou travadas). */
export const consequenciaRecalculo = (weeks: SeasonWeek[], anchorIndex: number) => {
    const depois = weeks.filter((w) => w.weekIndex > anchorIndex);
    const mantidas = depois.filter((w) => w.locked || w.valueSource === 'COACH').length;
    return { reescritas: depois.length - mantidas, mantidas };
};

/** Pico alcançado quando fica 0,5 km ou mais abaixo do pedido; `null` quando é só arredondamento. */
export const avisoPicoNaoAlcancado = (pedido: number, weeks: SeasonWeek[], anchorIndex: number): number | null => {
    const alcancado = picoDeSubida(weeks, anchorIndex);
    return umaCasa(pedido - alcancado) >= AVISO_PICO_KM ? alcancado : null;
};
