import type { AlvoPrimario, AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import type { EtapaTreinoDto } from '../../../types/PlanoReview';
import type { ZoneKey } from '../../workout/profile/types';
import { formatPace, formatPaceRange, matchZone, parseCanonicalFc, parseCanonicalPace } from './intensityFormat';

/** Linha de meta de uma etapa para os cards: ordem fixa pace → FC, o eixo primário só se distingue por peso. */
export interface IntensityLine {
    /** `null` em alvo personalizado ou quando as zonas ainda não carregaram — o card não mostra chip. */
    zona: ZoneKey | null;
    pace?: string;
    fc?: string;
    primario: AlvoPrimario | null;
    /** O atleta não tem pace de limiar e a etapa não traz ritmo próprio. */
    paceIndisponivel: boolean;
}

const TIPOS_SEM_ESFORCO = new Set(['AQUECIMENTO', 'RECUPERACAO', 'DESAQUECIMENTO']);

function textoDePace(texto: string): string {
    const faixa = parseCanonicalPace(texto);
    if (!faixa) return texto.trim();
    return faixa.minSegKm === faixa.maxSegKm ? formatPace(faixa.minSegKm) : formatPaceRange(faixa.minSegKm, faixa.maxSegKm);
}

function textoDeFc(texto: string): string {
    const faixa = parseCanonicalFc(texto);
    return faixa ? `${faixa.min}–${faixa.max} bpm` : texto.trim();
}

export function buildIntensityLineFromEtapa(
    etapa: EtapaTreinoDto,
    zones: AthleteTrainingZonesDto | null,
): IntensityLine | null {
    const fcTexto = etapa.fcAlvoEtapa?.trim() || undefined;
    const paceTexto = etapa.ritmoAlvo?.trim() || undefined;
    if (!fcTexto && !paceTexto) return null;

    const fcFaixa = parseCanonicalFc(fcTexto) ?? undefined;
    const paceFaixa = parseCanonicalPace(paceTexto) ?? undefined;
    const zona = zones ? matchZone(fcFaixa, paceFaixa, zones.zonas) : null;

    // Etapa legada (sem eixo gravado): o backend deriva FC primeiro, depois pace.
    const primario = etapa.alvoPrimario ?? (fcTexto ? 'FC' : 'PACE');

    return {
        zona,
        pace: paceTexto ? textoDePace(paceTexto) : undefined,
        fc: fcTexto ? textoDeFc(fcTexto) : undefined,
        primario,
        paceIndisponivel: Boolean(zones && !zones.disponibilidade.pace && !paceTexto),
    };
}

/** Linha do treino = a da primeira etapa de esforço que tem alvo (aquecimento e desaquecimento não definem o treino). */
export function buildIntensityLineFromTreino(
    etapas: EtapaTreinoDto[] | undefined,
    zones: AthleteTrainingZonesDto | null,
): IntensityLine | null {
    for (const etapa of etapas ?? []) {
        if (TIPOS_SEM_ESFORCO.has(etapa.tipoEtapa.toUpperCase())) continue;
        const linha = buildIntensityLineFromEtapa(etapa, zones);
        if (linha) return linha;
    }
    return null;
}
