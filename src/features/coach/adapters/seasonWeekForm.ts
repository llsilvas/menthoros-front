import type { SeasonWeek, SeasonWeekUpdate, TrainingPhase } from '../../../types/SeasonPlan';

/** Formulário de edição de uma semana do ajuste da temporada: números como texto digitado. */
export interface SeasonWeekForm {
    phase: TrainingPhase;
    targetVolumeKm: string;
    longRunKm: string;
    targetTss: string;
    deload: boolean;
    keySessions: string;
}

export type SeasonWeekFormErrors = Partial<Record<'targetVolumeKm' | 'longRunKm' | 'targetTss', string>>;

export const KEY_SESSIONS_MAX = 500;

/** Inteiro ou decimal não negativo, com vírgula ou ponto (sem notação científica ou hexadecimal). */
const NUMERO = /^\d+([.,]\d+)?$/;

export const toSeasonWeekForm = (w: SeasonWeek): SeasonWeekForm => ({
    phase: w.phase,
    targetVolumeKm: w.targetVolumeKm == null ? '' : String(w.targetVolumeKm),
    longRunKm: w.longRunKm == null ? '' : String(w.longRunKm),
    targetTss: w.targetTss == null ? '' : String(Math.round(w.targetTss)),
    deload: w.deload,
    keySessions: w.keySessions ?? '',
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
    return errors;
};

/** Corpo do PATCH; chamar só com o formulário válido. `keySessions` vazio limpa no backend. */
export const toSeasonWeekUpdate = (form: SeasonWeekForm): SeasonWeekUpdate => ({
    phase: form.phase,
    targetVolumeKm: parseNumeroNaoNegativo(form.targetVolumeKm),
    longRunKm: parseNumeroNaoNegativo(form.longRunKm),
    targetTss: parseNumeroNaoNegativo(form.targetTss),
    deload: form.deload,
    keySessions: form.keySessions.trim(),
});
