import type { AthleteTrainingZoneDto } from '../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../workout/profile/types';

export interface PaceRange {
    minSegKm: number;
    maxSegKm: number;
}

export interface FcRange {
    min: number;
    max: number;
}

/** Tolerâncias ao reconhecer uma zona a partir de valores gravados (arredondamento do cálculo). */
const TOLERANCIA_FC_BPM = 1;
const TOLERANCIA_PACE_SEG = 2;

// Mesmos formatos que IntervalsIcuTargetParser (backend) lê — um valor fora deles não vira alvo no relógio.
const PACE_FAIXA = /^(\d{1,2}):([0-5]\d)-(\d{1,2}):([0-5]\d)(\/km)?$/;
const PACE_UNICO = /^(\d{1,2}):([0-5]\d)(\/km)?$/;
const FC_BPM = /^(\d{2,3})-(\d{2,3})\s*bpm$/;
const FC_PERCENT = /^(\d{2,3})-(\d{2,3})%.*$/;
const FC_ZONA = /^z([1-5])(-z?[1-5])?$/i;

const mmss = (seg: number): string => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;

export const formatPace = (seg: number): string => mmss(seg);

export const formatPaceRange = (minSeg: number, maxSeg: number): string => `${mmss(minSeg)}–${mmss(maxSeg)}`;

export const toCanonicalPace = (minSeg: number, maxSeg: number): string => `${mmss(minSeg)}-${mmss(maxSeg)}/km`;

export const toCanonicalFc = (min: number, max: number): string => `${min}-${max} bpm`;

export function parseCanonicalPace(texto: string | undefined): PaceRange | null {
    const t = texto?.trim();
    if (!t) return null;
    const faixa = PACE_FAIXA.exec(t);
    if (faixa) {
        return { minSegKm: Number(faixa[1]) * 60 + Number(faixa[2]), maxSegKm: Number(faixa[3]) * 60 + Number(faixa[4]) };
    }
    const unico = PACE_UNICO.exec(t);
    if (unico) {
        const seg = Number(unico[1]) * 60 + Number(unico[2]);
        return { minSegKm: seg, maxSegKm: seg };
    }
    return null;
}

export function parseCanonicalFc(texto: string | undefined): FcRange | null {
    const m = FC_BPM.exec(texto?.trim() ?? '');
    return m ? { min: Number(m[1]), max: Number(m[2]) } : null;
}

/**
 * A FC vira alvo no relógio quando o parser do backend a entende: faixa em bpm, faixa em % ou zona
 * ("Z2", "Z2-Z3"). Só a faixa em bpm é o formato que o seletor grava; os outros são legado válido.
 */
export const fcEntendidaPeloRelogio = (texto: string | undefined): boolean => {
    const t = texto?.trim() ?? '';
    return FC_BPM.test(t) || FC_PERCENT.test(t) || FC_ZONA.test(t);
};

const perto = (a: number, b: number, tolerancia: number): boolean => Math.abs(a - b) <= tolerancia;

/**
 * Reconhece em qual zona do atleta caem os valores gravados na etapa. Cada eixo informado tem de casar
 * a mesma zona; sem nenhum eixo, ou com eixos de zonas diferentes, devolve `null`.
 */
export function matchZone(
    fc: FcRange | undefined,
    pace: PaceRange | undefined,
    zonas: AthleteTrainingZoneDto[],
): ZoneKey | null {
    if (!fc && !pace) return null;
    const zona = zonas.find((z) => {
        const fcOk = !fc || (z.fc !== undefined && perto(fc.min, z.fc.min, TOLERANCIA_FC_BPM) && perto(fc.max, z.fc.max, TOLERANCIA_FC_BPM));
        const paceOk =
            !pace ||
            (z.pace !== undefined &&
                perto(pace.minSegKm, z.pace.minSegKm, TOLERANCIA_PACE_SEG) &&
                perto(pace.maxSegKm, z.pace.maxSegKm, TOLERANCIA_PACE_SEG));
        return fcOk && paceOk;
    });
    return zona ? (`Z${zona.numero}` as ZoneKey) : null;
}
