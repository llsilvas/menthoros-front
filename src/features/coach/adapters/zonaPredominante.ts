import type { ProfileBlock, ZoneKey } from '../../workout/profile/types';

export interface ZonaPredominante {
    zona: ZoneKey;
    segundos: number;
    /** Tempo por zona, só das etapas com zona escolhida. */
    distribuicao: Array<{ zone: ZoneKey; seconds: number }>;
}

/** Abaixo disso a zona é pico incidental, não o caráter do treino. */
const SHARE_MINIMO = 0.15;
const ORDEM: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'];
const minutos = (segundos: number): number => Math.round(segundos / 60);

/**
 * Zona predominante do treino, **só das etapas cuja zona foi escolhida** (`prescribed`).
 *
 * O `targetZone` do perfil é `null` em todo perfil degradado — basta uma etapa sem zona (um
 * aquecimento, por exemplo) —, e isso apagava a predominante das etapas que o treinador já tinha
 * definido. Zona estimada (`derived`) ou desconhecida não entra: este campo é gravado no plano.
 */
export function zonaPredominante(blocks: ProfileBlock[]): ZonaPredominante | null {
    const segundosPorZona = new Map<ZoneKey, number>();
    for (const b of blocks) {
        if (b.confidence !== 'prescribed') continue;
        segundosPorZona.set(b.zone, (segundosPorZona.get(b.zone) ?? 0) + b.durationSec);
    }
    const total = [...segundosPorZona.values()].reduce((a, b) => a + b, 0);
    if (total <= 0) return null;

    const distribuicao = [...segundosPorZona.entries()]
        .map(([zone, seconds]) => ({ zone, seconds }))
        .sort((a, b) => ORDEM.indexOf(a.zone) - ORDEM.indexOf(b.zone));
    const alvo = distribuicao
        .filter((d) => d.seconds / total >= SHARE_MINIMO)
        .reduce<{ zone: ZoneKey; seconds: number } | null>(
            (maior, d) => (!maior || ORDEM.indexOf(d.zone) > ORDEM.indexOf(maior.zone) ? d : maior),
            null,
        );
    return alvo ? { zona: alvo.zone, segundos: alvo.seconds, distribuicao } : null;
}

export function minutosNaZonaAlvo(z: ZonaPredominante | null): number | null {
    return z ? minutos(z.segundos) : null;
}

/** "24 min em Z5, 38 min em Z1": a zona alvo e a que mais tempo toma depois dela. */
export function detalheDaZonaPredominante(z: ZonaPredominante | null): string | null {
    if (!z) return null;
    const outra = [...z.distribuicao]
        .filter((d) => d.zone !== z.zona)
        .sort((a, b) => b.seconds - a.seconds)[0];
    const partes = [`${minutos(z.segundos)} min em ${z.zona}`];
    if (outra) partes.push(`${minutos(outra.seconds)} min em ${outra.zone}`);
    return partes.join(', ');
}
