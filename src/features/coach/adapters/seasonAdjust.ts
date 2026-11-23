import { EDITABLE_PHASES, TRAINING_PHASE_LABEL } from '../../../types/SeasonPlan';
import type { EditablePhase, SeasonDiffField, SeasonPlanDiffEntry, SeasonWeek, TrainingPhase } from '../../../types/SeasonPlan';
import { formatKmPt } from './format';

/** Volume de partida máximo aceito pelo recálculo (`SeasonPlanAdjustmentServiceImpl`). */
export const START_VOLUME_MAX = 500;

export const VALUE_SOURCE_LABEL: Record<SeasonWeek['valueSource'], string> = {
    ENGINE: 'motor',
    COACH: 'treinador',
    AI_ACCEPTED: 'sugestão aceita',
};

export const DIFF_FIELD_LABEL: Record<SeasonDiffField, string> = {
    phase: 'Fase',
    targetVolumeKm: 'Volume',
    targetTss: 'TSS',
    longRunKm: 'Longão',
    deload: 'Descarga',
    keySessions: 'Sessões-chave',
};

/** Semanas por fase editável no rascunho (a semana da prova fica fora). */
export const countPhaseWeeks = (weeks: SeasonWeek[]): Record<EditablePhase, number> => {
    const contagem = Object.fromEntries(EDITABLE_PHASES.map((p) => [p, 0])) as Record<EditablePhase, number>;
    for (const w of weeks) {
        if (w.phase in contagem) contagem[w.phase as EditablePhase] += 1;
    }
    return contagem;
};

/** Semanas que o recálculo regenera: as não travadas que não foram editadas pelo treinador. */
export const weeksToRegenerate = (weeks: SeasonWeek[]): number[] =>
    weeks.filter((w) => !w.locked && w.valueSource !== 'COACH').map((w) => w.weekIndex);

/** Semanas editadas pelo treinador que o recálculo preserva. */
export const coachEditedWeeks = (weeks: SeasonWeek[]): number[] =>
    weeks.filter((w) => !w.locked && w.valueSource === 'COACH').map((w) => w.weekIndex);

/** "3", "3 e 4", "3, 4 e 5". */
export const joinWeeks = (nums: number[]): string =>
    nums.length <= 1 ? nums.join('') : `${nums.slice(0, -1).join(', ')} e ${nums[nums.length - 1]}`;

/**
 * Volume digitado pelo treinador ("40,5" ou "40.5") como número válido para o recálculo, ou `null`:
 * positivo, até {@link START_VOLUME_MAX} e com no máximo uma casa decimal (a coluna é `NUMERIC(6,1)`).
 */
export const parseStartVolume = (texto: string): number | null => {
    const normalizado = texto.trim().replace(',', '.');
    if (!/^\d+(\.\d)?$/.test(normalizado)) return null;
    const valor = Number(normalizado);
    return valor > 0 && valor <= START_VOLUME_MAX ? valor : null;
};

/** Valor de um campo do diff para a tela; `null` vira "—". */
export const formatDiffValue = (field: SeasonDiffField, value: SeasonPlanDiffEntry['before']): string => {
    if (value === null || value === '') return '—';
    switch (field) {
        case 'phase': return TRAINING_PHASE_LABEL[value as TrainingPhase] ?? String(value);
        case 'targetVolumeKm':
        case 'longRunKm': return `${formatKmPt(Number(value))} km`;
        case 'targetTss': return String(Math.round(Number(value)));
        case 'deload': return value ? 'sim' : 'não';
        case 'keySessions': return String(value);
    }
};

/** Diff indexado por semana e campo, para a tabela achar o valor anterior de cada célula. */
export const indexDiff = (diff: SeasonPlanDiffEntry[]): Map<string, SeasonPlanDiffEntry> =>
    new Map(diff.map((d) => [diffKey(d.weekIndex, d.field), d]));

export const diffKey = (weekIndex: number, field: SeasonDiffField) => `${weekIndex}:${field}`;
